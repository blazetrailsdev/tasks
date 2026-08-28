/**
 * The RFC auto-close, exercised through the verbs rather than by calling the
 * rule directly — the thing that breaks is a verb quietly going back to
 * `updateAll` and skipping the callback, and only a verb-level test catches it.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { Base } from "@blazetrails/activerecord";
import { migrate } from "./migrator.js";
import { Event, Rfc, Story } from "./models/index.js";
import { block, close, markTracking, statusSet } from "./verbs.js";
import { exportState } from "./export.js";
import { buildIndex } from "./readmodel.js";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function reset(): Promise<void> {
  for (const t of ["events", "stories", "rfcs"]) {
    await Base.connection.execute(`DELETE FROM ${t}`);
  }
  await Rfc.create({ id: "0001-r", status: "active", title: "R" });
  await Story.create({ id: "s1", rfc_id: "0001-r", status: "ready" });
  await Story.create({ id: "s2", rfc_id: "0001-r", status: "ready" });
}

const rfcStatus = async (id = "0001-r"): Promise<string> =>
  (await Rfc.findBy({ id }))!.status as string;

beforeEach(async () => {
  await Base.establishConnection({ adapter: "node-sqlite", database: ":memory:", pool: 1 });
  await migrate();
  await reset();
});

describe("rfc auto-close", () => {
  it("closes the RFC when the last story is marked done", async () => {
    await markTracking(["s1"], "done", 10);
    expect(await rfcStatus()).toBe("active");
    await markTracking(["s2"], "done", 11);
    expect(await rfcStatus()).toBe("closed");
  });

  it("counts a closed story as landed, not as outstanding work", async () => {
    await markTracking(["s1"], "done", 10);
    await close("s2", "superseded by the rewrite");
    expect(await rfcStatus()).toBe("closed");
  });

  it("fires from `status` too, not just the tracking verbs", async () => {
    await statusSet("s1", "done");
    await statusSet("s2", "closed");
    expect(await rfcStatus()).toBe("closed");
  });

  it("leaves the RFC active while any story is still open", async () => {
    await markTracking(["s1"], "done", 10);
    await block("s2", "waiting on upstream");
    expect(await rfcStatus()).toBe("active");
  });

  it("records an rfc-close event naming the RFC, so the close is chartable", async () => {
    await markTracking(["s1", "s2"], "done", 10);
    const events = await Event.where({ verb: "rfc-close" }).toArray();
    expect(events.map((e) => e.rfc_id)).toEqual(["0001-r"]);
    expect(events[0].story_id).toBeNull();
  });

  it("does not close an RFC that has no stories yet", async () => {
    await Rfc.create({ id: "0002-empty", status: "active", title: "Empty" });
    await markTracking(["s1", "s2"], "done", 10);
    expect(await rfcStatus("0002-empty")).toBe("active");
  });

  it("leaves a draft RFC alone — only an active one closes", async () => {
    await Rfc.where({ id: "0001-r" }).updateAll({ status: "draft" });
    await markTracking(["s1", "s2"], "done", 10);
    expect(await rfcStatus()).toBe("draft");
  });

  it("closes once: a repeat of the landing verb does not re-fire the event", async () => {
    await markTracking(["s1", "s2"], "done", 10);
    await markTracking(["s1"], "done", 10);
    await statusSet("s2", "done");
    expect((await Event.where({ verb: "rfc-close" }).count()) as number).toBe(1);
  });

  it("carries the close back into the RFC's frontmatter on the next export", async () => {
    const dir = mkdtempSync(join(tmpdir(), "tasks-export-"));
    mkdirSync(join(dir, "rfcs/0001-r"), { recursive: true });
    const rel = "rfcs/0001-r/README.md";
    writeFileSync(join(dir, rel), "---\nid: 0001-r\nstatus: active\n---\n\nbody\n");
    await Rfc.where({ id: "0001-r" }).updateAll({ file_path: rel });

    await markTracking(["s1", "s2"], "done", 10);
    const result = await exportState({ tasksDir: dir, commit: false });

    expect(result.changed).toContain(rel);
    expect(readFileSync(join(dir, rel), "utf8")).toContain("status: closed");

    // Second run is a no-op: the file already agrees with the DB, so a quiet
    // hour still produces no commit.
    expect((await exportState({ tasksDir: dir, commit: false })).changed).toEqual([]);
  });

  it("never closes the CI-failures RFC, whose backlog is empty between reds", async () => {
    await Rfc.create({ id: "0061-ci-failures", status: "active", title: "CI failures" });
    await Story.create({ id: "red-abc12345", rfc_id: "0061-ci-failures", status: "ready" });
    await markTracking(["red-abc12345"], "done", 99);
    expect(await rfcStatus("0061-ci-failures")).toBe("active");
  });
});

/**
 * Saving a record runs Rails' timestamp touch, which claims `updated_on` as
 * well as `updated_at`. The verbs write date-only strings there (it is
 * markdown's `updated:` field), and a full instant in that column makes
 * readmodel's isoMidnight produce an Invalid Date — `next-bundle` then throws
 * "Invalid time value" for every caller and the spawn loop stops. This is what
 * happened the day the verbs stopped using updateAll.
 */
describe("date-only updated_on survives a record save", () => {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/;

  it("keeps a story's updated_on date-only when the verb re-stamps today", async () => {
    // The trap needs the value to be UNCHANGED by the save: the touch skips a
    // column the save is already changing, so only a re-stamp exposes it.
    const today = new Date().toISOString().slice(0, 10);
    await Story.where({ id: "s1" }).updateAll({ updated_on: today });

    await markTracking(["s1"], "done", 42);

    const s = await Story.findBy({ id: "s1" });
    expect(String(s!.updated_on)).toMatch(dateOnly);
  });

  it("survives the library nilling its timestamp-column cache", async () => {
    // reloadSchemaFromCache (model-schema.js:827) sets these to undefined
    // whenever column information is loaded or reset. A plain static-block
    // assignment is silently undone by that — which is exactly what happened
    // in production twenty-six minutes after the first fix shipped, while this
    // suite stayed green. Simulate the reset, then re-check.
    (
      Story as unknown as { _timestampAttributesForUpdateInModel?: string[] }
    )._timestampAttributesForUpdateInModel = undefined;
    (
      Rfc as unknown as { _timestampAttributesForUpdateInModel?: string[] }
    )._timestampAttributesForUpdateInModel = undefined;

    const today = new Date().toISOString().slice(0, 10);
    await Story.where({ id: "s1" }).updateAll({ updated_on: today });
    await markTracking(["s1"], "done", 42);

    expect(String((await Story.findBy({ id: "s1" }))!.updated_on)).toMatch(dateOnly);
  });

  it("keeps an RFC's updated_on date-only when it auto-closes", async () => {
    await markTracking(["s1", "s2"], "done", 42);
    const rfc = await Rfc.findBy({ id: "0001-r" });
    expect(rfc!.status).toBe("closed");
    expect(String(rfc!.updated_on)).toMatch(dateOnly);
  });
});

/**
 * buildIndex runs on every read verb and after every mutation, so anything it
 * throws on takes the whole CLI down for every user on the host — twice now,
 * for the same reason. It must degrade instead.
 */
describe("buildIndex tolerates a malformed updated_on", () => {
  it("does not take the whole index down for one bad row", async () => {
    await Story.where({ id: "s1" }).updateAll({
      updated_on: "2026-08-28T14:30:00.731400469Z",
    });
    const index = await buildIndex();
    expect(index.stories.find((s) => s.id === "s1")).toBeTruthy();
    expect(index.stories.find((s) => s.id === "s2")).toBeTruthy();
  });
});
