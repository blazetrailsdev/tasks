/**
 * A push that reopens an RFC and adds stories to it must leave the RFC open.
 * Ingest reads the README before the new story files, so a close check made
 * while reading would see only the old, finished stories and close the RFC.
 * That is what happened to 0241-request-path-performance on 2026-11-16.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { Base } from "@blazetrails/activerecord";
import { migrate } from "./migrator.js";
import { Event, Rfc, Story } from "./models/index.js";
import { ingestChunkForTest, type IngestResult } from "./ingest.js";
import { withDeferredAutoClose } from "./rfc-close.js";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const RFC = "0241-perf";

const result = (): IngestResult => ({
  from: null,
  to: "0".repeat(40),
  scanned: 0,
  created: 0,
  updated: 0,
  closed: 0,
  rfcsTouched: 0,
});

/** A checkout where RFC is active and holds one new `ready` story. */
function checkout(): { dir: string; paths: string[] } {
  const dir = mkdtempSync(join(tmpdir(), "tasks-autoclose-"));
  mkdirSync(join(dir, "rfcs", RFC, "stories"), { recursive: true });
  writeFileSync(
    join(dir, "rfcs", RFC, "README.md"),
    `---\nrfc: "${RFC}"\ntitle: "Perf"\nstatus: active\n---\n\n# RFC 0241 — Perf\n`,
  );
  writeFileSync(
    join(dir, "rfcs", RFC, "stories", "s-new.md"),
    `---\ntitle: "New"\nstatus: ready\nrfc: "${RFC}"\ncluster: null\ndeps: []\ndeps-rfc: []\nest-loc: 10\n---\n\nbody\n`,
  );
  return { dir, paths: [`rfcs/${RFC}/README.md`, `rfcs/${RFC}/stories/s-new.md`] };
}

beforeEach(async () => {
  await Base.establishConnection({ adapter: "node-sqlite", database: ":memory:", pool: 1 });
  await migrate();
  for (const t of ["events", "story_rfc_deps", "stories", "rfcs"]) {
    await Base.connection.execute(`DELETE FROM ${t}`);
  }
  // The DB as the reopening push finds it: auto-closed, every story done.
  await Rfc.create({ id: RFC, status: "closed", title: "Perf" });
  await Story.create({ id: "s-old", rfc_id: RFC, status: "done" });
});

describe("auto-close during ingest", () => {
  it("keeps a reopened RFC open when its new stories sort after the README", async () => {
    const { dir, paths } = checkout();

    await withDeferredAutoClose(() => ingestChunkForTest(paths, dir, result()));

    expect((await Rfc.findBy({ id: RFC }))!.status).toBe("active");
    expect((await Event.where({ verb: "rfc-close" }).count()) as number).toBe(0);
  });

  it("closes the RFC once the whole push is read if nothing is left open", async () => {
    const { dir } = checkout();
    // Same push, but the README is the only path: the backlog is all done.

    await withDeferredAutoClose(() => ingestChunkForTest([`rfcs/${RFC}/README.md`], dir, result()));

    expect((await Rfc.findBy({ id: RFC }))!.status).toBe("closed");
    expect((await Event.where({ verb: "rfc-close" }).count()) as number).toBe(1);
  });

  it("closes it too early without the deferral, which is the bug", async () => {
    const { dir, paths } = checkout();

    await ingestChunkForTest(paths, dir, result());

    expect((await Rfc.findBy({ id: RFC }))!.status).toBe("closed");
  });
});
