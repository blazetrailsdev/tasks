/**
 * Ingest reaps vanished STORY files but used to ignore vanished RFCs — and
 * every RFC leaves one behind, because finalize-rfc.mjs renames `0000-<slug>`
 * to `NNNN-<slug>` at merge. Ingest created the numbered row and kept the
 * placeholder: two identical `active` RFCs seconds apart, one pointing at a
 * directory that does not exist, both listed on the site.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { Base } from "@blazetrails/activerecord";
import { migrate } from "./migrator.js";
import { Event, Rfc, Story, StoryRfcDep } from "./models/index.js";
import { ingestRfcForTest } from "./ingest.js";

beforeEach(async () => {
  await Base.establishConnection({ adapter: "node-sqlite", database: ":memory:", pool: 1 });
  await migrate();
  for (const t of ["events", "story_rfc_deps", "stories", "rfcs"]) {
    await Base.connection.execute(`DELETE FROM ${t}`);
  }
});

describe("an RFC whose README is gone", () => {
  it("hands a finalized placeholder's history to its numbered successor", async () => {
    await Rfc.create({ id: "0000-param-drift", status: "active", title: "Param drift" });
    await Rfc.create({ id: "0128-param-drift", status: "active", title: "Param drift" });
    await Event.create({ at: "2026-08-28T16:36:09Z", verb: "new", rfc_id: "0000-param-drift" });
    await Story.create({ id: "s-strays", rfc_id: "0000-param-drift", status: "ready" });
    await StoryRfcDep.create({ story_id: "s-strays", rfc_id: "0000-param-drift" });

    await ingestRfcForTest("/nonexistent", "rfcs/0000-param-drift/README.md", "0000-param-drift");

    expect(await Rfc.findBy({ id: "0000-param-drift" })).toBeNull();
    // The birth events are the only record of when that work was created, so
    // they move rather than die with the placeholder identity.
    expect((await Event.where({ rfc_id: "0128-param-drift" }).count()) as number).toBe(1);
    expect((await Story.findBy({ id: "s-strays" }))!.rfc_id).toBe("0128-param-drift");
    expect((await StoryRfcDep.where({ rfc_id: "0128-param-drift" }).count()) as number).toBe(1);
  });

  it("closes a numbered RFC rather than deleting it", async () => {
    // Not a rename — a real RFC's directory was removed. The row carries
    // history that outlives the file, exactly as with stories.
    await Rfc.create({ id: "0099-real", status: "active", title: "Real" });

    await ingestRfcForTest("/nonexistent", "rfcs/0099-real/README.md", "0099-real");

    const rfc = await Rfc.findBy({ id: "0099-real" });
    expect(rfc).not.toBeNull();
    expect(rfc!.status).toBe("closed");
  });

  it("keeps a placeholder that has no single successor, rather than guessing", async () => {
    await Rfc.create({ id: "0000-ambiguous", status: "active", title: "A" });
    await Rfc.create({ id: "0101-ambiguous", status: "active", title: "A" });
    await Rfc.create({ id: "0102-ambiguous", status: "active", title: "A" });

    await ingestRfcForTest("/nonexistent", "rfcs/0000-ambiguous/README.md", "0000-ambiguous");

    const rfc = await Rfc.findBy({ id: "0000-ambiguous" });
    expect(rfc).not.toBeNull();
    expect(rfc!.status).toBe("closed");
  });

  it("is a no-op for an RFC that was never ingested", async () => {
    await ingestRfcForTest("/nonexistent", "rfcs/0077-never-seen/README.md", "0077-never-seen");
    expect((await Rfc.all().count()) as number).toBe(0);
  });
});
