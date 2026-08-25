/**
 * Regression tests for the behaviors that were wrong at least once during the
 * build. Each one here corresponds to a bug that actually shipped into a file
 * or a DB row before being caught — they are not hypotheticals.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { Base } from "@blazetrails/activerecord";
import { migrate } from "./migrator.js";
import { Event, Rfc, Story } from "./models/index.js";
import { claim, markTracking, release, close } from "./verbs.js";
import { VerbExit } from "./db.js";

async function reset(): Promise<void> {
  for (const t of ["events", "stories", "rfcs"]) {
    await Base.connection.execute(`DELETE FROM ${t}`);
  }
  await Rfc.create({ id: "0001-r", status: "active", title: "R" });
  await Story.create({ id: "s1", rfc_id: "0001-r", status: "ready", est_loc: 10 });
  await Story.create({ id: "s2", rfc_id: "0001-r", status: "ready", est_loc: 20 });
}

beforeEach(async () => {
  await Base.establishConnection({ adapter: "node-sqlite", database: ":memory:", pool: 1 });
  await migrate();
  await reset();
});

describe("claim", () => {
  it("wins once and reports the loser as a benign conflict, not an error", async () => {
    await claim(["s1"], "agent-a");
    await expect(claim(["s1"], "agent-b")).rejects.toMatchObject({ code: 2 });
    const s = await Story.findBy({ id: "s1" });
    expect(s!.assignee).toBe("agent-a");
    expect(s!.status).toBe("claimed");
  });

  it("treats re-claiming what we already hold as success", async () => {
    await claim(["s1"], "agent-a");
    await expect(claim(["s1"], "agent-a")).resolves.toBeUndefined();
  });

  it("is all-or-nothing: one taken id refuses the whole batch", async () => {
    await claim(["s2"], "other");
    await expect(claim(["s1", "s2"], "agent-a")).rejects.toBeInstanceOf(VerbExit);
    // s1 must NOT have been claimed — a half-claimed bundle strands stories
    // as `claimed` with nobody behind them, invisible to both `ready` and the
    // merge sweep.
    expect((await Story.findBy({ id: "s1" }))!.status).toBe("ready");
  });

  it("records exactly one claim event for one successful claim", async () => {
    await claim(["s1"], "agent-a");
    expect(await Event.where({ story_id: "s1", verb: "claim" }).count()).toBe(1);
  });
});

describe("status values", () => {
  // The enum previously mapped label `inProgress` -> value "in-progress".
  // Rails' enum getter returns the LABEL while raw SQL returns the VALUE, so
  // model-based writers emitted `status: inProgress` into story files while
  // SQL-based readers saw "in-progress". Identity labels remove the gap.
  it("reads back the hyphenated value, not a camelCase label", async () => {
    await markTracking(["s1"], "in-progress", 42);
    const viaModel = (await Story.findBy({ id: "s1" }))!.status;
    const viaSql = (
      await Base.connection.selectAll("SELECT status FROM stories WHERE id='s1'")
    ).toArray()[0].status;
    expect(viaModel).toBe("in-progress");
    expect(viaSql).toBe("in-progress");
    expect(viaModel).toBe(viaSql);
  });
});

describe("claim timestamps", () => {
  // claim_at was a `datetime` column, and the adapter normalized writes to
  // "YYYY-MM-DD HH:MM:SS" — silently changing the format of the first story
  // claimed through the new CLI. btwhooks parses this text for stale-claim
  // detection and every one of the repo's existing values is ISO-seconds-Z.
  it("stores the exact ISO-seconds-Z text it was given", async () => {
    await claim(["s1"], "agent-a");
    const raw = (
      await Base.connection.selectAll("SELECT claim_at FROM stories WHERE id='s1'")
    ).toArray()[0].claim_at as string;
    expect(raw).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});

describe("markTracking", () => {
  it("skips an id already at this exact status+pr rather than failing", async () => {
    await markTracking(["s1"], "done", 7);
    await expect(markTracking(["s1"], "done", 7)).resolves.toBeUndefined();
    expect(await Event.where({ story_id: "s1", verb: "done" }).count()).toBe(1);
  });

  it("is best-effort per id, unlike claim", async () => {
    await markTracking(["s1"], "done", 7);
    await markTracking(["s1", "s2"], "done", 7);
    expect((await Story.findBy({ id: "s2" }))!.status).toBe("done");
  });
});

describe("release", () => {
  it("round-trips a claim back to ready", async () => {
    await claim(["s1"], "agent-a");
    await release(["s1"]);
    const s = await Story.findBy({ id: "s1" });
    expect(s!.status).toBe("ready");
    expect(s!.assignee).toBeNull();
    expect(s!.claim_at).toBeNull();
  });
});

describe("close", () => {
  it("requires a reason — it is the only record of why work was abandoned", async () => {
    await expect(close("s1", "   ")).rejects.toMatchObject({ code: 1 });
  });

  it("carries the reason into the event, so it survives file deletion", async () => {
    await close("s1", "superseded by s2");
    const e = await Event.findBy({ story_id: "s1", verb: "close" });
    expect(String(e!.detail)).toContain("superseded by s2");
  });
});
