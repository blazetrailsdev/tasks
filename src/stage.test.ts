/** `tasks stage`: the stage an agent reports for its story (RFC 0232). */
import { beforeEach, describe, expect, it } from "vitest";
import { Base } from "@blazetrails/activerecord";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { migrate } from "./migrator.js";
import { Event, Rfc, Story } from "./models/index.js";
import { REPORTED_STAGES, markTracking, setStage, statusSet } from "./verbs.js";
import { DB_OWNED, ingestChunkForTest, type IngestResult } from "./ingest.js";

const stageOf = async (id: string) => (await Story.findBy({ id }))!.stage;

beforeEach(async () => {
  await Base.establishConnection({ adapter: "node-sqlite", database: ":memory:", pool: 1 });
  await migrate();
  for (const t of ["events", "stories", "rfcs"]) await Base.connection.execute(`DELETE FROM ${t}`);
  await Rfc.create({ id: "0001-a", status: "active", title: "A" });
  await Story.create({ id: "s", rfc_id: "0001-a", status: "claimed", est_loc: 10 });
});

describe("tasks stage", () => {
  it("accepts drafting and self", () => {
    expect([...REPORTED_STAGES]).toEqual(["drafting", "self"]);
  });

  it("sets the stage and records an event", async () => {
    await setStage("s", "self");
    expect(await stageOf("s")).toBe("self");
    const events = await Event.where({ story_id: "s", verb: "stage" }).toArray();
    expect(events).toHaveLength(1);
  });

  it("refuses a stage the agent cannot report", async () => {
    await expect(setStage("s", "merged")).rejects.toMatchObject({ code: 1 });
    expect(await stageOf("s")).toBeNull();
  });

  it("refuses an unknown story", async () => {
    await expect(setStage("nope", "self")).rejects.toMatchObject({ code: 1 });
  });

  it("is cleared by in-progress", async () => {
    await setStage("s", "self");
    await markTracking(["s"], "in-progress", "trailmap#1");
    expect(await stageOf("s")).toBeNull();
  });

  it("is cleared by done", async () => {
    await setStage("s", "self");
    await markTracking(["s"], "done", null);
    expect(await stageOf("s")).toBeNull();
  });

  it("survives a status change that is not in-progress or done", async () => {
    await setStage("s", "self");
    await statusSet(["s"], "blocked");
    expect(await stageOf("s")).toBe("self");
  });

  it("is DB-owned, so ingest never reads it from markdown", async () => {
    expect(DB_OWNED as readonly string[]).toContain("stage");
    await setStage("s", "self");
    const dir = mkdtempSync(join(tmpdir(), "ingest-stage-"));
    mkdirSync(join(dir, "rfcs/0001-a/stories"), { recursive: true });
    writeFileSync(join(dir, "rfcs/0001-a/README.md"), "---\ntitle: A\n---\nThe RFC.\n");
    writeFileSync(
      join(dir, "rfcs/0001-a/stories/s.md"),
      "---\ntitle: S\nstage: drafting\n---\nThe story.\n",
    );
    const result: IngestResult = {
      from: null,
      to: "x",
      created: 0,
      updated: 0,
      closed: 0,
      rfcsTouched: 0,
      scanned: 0,
    };
    await ingestChunkForTest(["rfcs/0001-a/README.md", "rfcs/0001-a/stories/s.md"], dir, result);
    expect(await stageOf("s")).toBe("self");
  });
});
