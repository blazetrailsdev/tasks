/**
 * `priority` used to be markdown-owned while `tasks priority` wrote it to the
 * DB. Export never carried it out and the next ingest of that story reverted
 * it, so every priority an agent set was silently temporary — the ready queue
 * ranked on a value the file disagreed with. Four stories were drifting that
 * way when it was found.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { Base } from "@blazetrails/activerecord";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { migrate } from "./migrator.js";
import { Event, Rfc, Story } from "./models/index.js";
import { setPriority, setRfcPriority } from "./verbs.js";
import { exportState } from "./export.js";
import { DB_OWNED, MARKDOWN_OWNED, ingestRfcForTest } from "./ingest.js";

beforeEach(async () => {
  await Base.establishConnection({ adapter: "node-sqlite", database: ":memory:", pool: 1 });
  await migrate();
  for (const t of ["events", "stories", "rfcs"]) {
    await Base.connection.execute(`DELETE FROM ${t}`);
  }
  await Rfc.create({ id: "0001-r", status: "active", title: "R" });
});

describe("priority ownership", () => {
  it("is DB-owned, not markdown-owned", () => {
    expect(DB_OWNED as readonly string[]).toContain("priority");
    expect(MARKDOWN_OWNED as readonly string[]).not.toContain("priority");
  });

  it("carries a CLI-set priority back out to the story file", async () => {
    const dir = mkdtempSync(join(tmpdir(), "tasks-prio-"));
    mkdirSync(join(dir, "rfcs/0001-r/stories"), { recursive: true });
    const rel = "rfcs/0001-r/stories/s1.md";
    writeFileSync(join(dir, rel), "---\nid: s1\nstatus: ready\npriority: null\n---\n\nbody\n");
    await Story.create({ id: "s1", rfc_id: "0001-r", status: "ready", file_path: rel });

    await setPriority("s1", 10);
    const result = await exportState({ tasksDir: dir, commit: false });

    expect(result.changed).toContain(rel);
    // Bare, like status/pr/updated — quoting it would rewrite all 7,164 files.
    expect(readFileSync(join(dir, rel), "utf8")).toContain("priority: 10");
  });

  it("clears back to null in the file when the priority is cleared", async () => {
    const dir = mkdtempSync(join(tmpdir(), "tasks-prio-"));
    mkdirSync(join(dir, "rfcs/0001-r/stories"), { recursive: true });
    const rel = "rfcs/0001-r/stories/s1.md";
    writeFileSync(join(dir, rel), "---\nid: s1\nstatus: ready\npriority: 3\n---\n\nbody\n");
    await Story.create({
      id: "s1",
      rfc_id: "0001-r",
      status: "ready",
      priority: 3,
      file_path: rel,
    });

    await setPriority("s1", null);
    await exportState({ tasksDir: dir, commit: false });

    expect(readFileSync(join(dir, rel), "utf8")).toContain("priority: null");
  });
});

describe("RFC priority ownership", () => {
  it("carries a CLI-set RFC priority out to the README", async () => {
    const dir = mkdtempSync(join(tmpdir(), "tasks-rfcprio-"));
    mkdirSync(join(dir, "rfcs/0001-r"), { recursive: true });
    const rel = "rfcs/0001-r/README.md";
    writeFileSync(join(dir, rel), "---\ntitle: R\nstatus: active\npriority: 5\n---\n\nbody\n");
    await Rfc.where({ id: "0001-r" }).updateAll({ priority: 5, file_path: rel });

    await setRfcPriority("0001-r", 2);
    const result = await exportState({ tasksDir: dir, commit: false });

    expect(result.changed).toContain(rel);
    expect(readFileSync(join(dir, rel), "utf8")).toContain("priority: 2");
  });

  it("does not add a priority line to a README that has none", async () => {
    const dir = mkdtempSync(join(tmpdir(), "tasks-rfcprio-"));
    mkdirSync(join(dir, "rfcs/0001-r"), { recursive: true });
    const rel = "rfcs/0001-r/README.md";
    writeFileSync(join(dir, rel), "---\ntitle: R\nstatus: active\n---\n\nbody\n");
    await Rfc.where({ id: "0001-r" }).updateAll({ file_path: rel });

    const result = await exportState({ tasksDir: dir, commit: false });
    expect(result.changed).not.toContain(rel);
  });

  it("is not reverted by a later ingest of an edited README", async () => {
    const dir = mkdtempSync(join(tmpdir(), "tasks-rfcprio-"));
    mkdirSync(join(dir, "rfcs/0002-s"), { recursive: true });
    const rel = "rfcs/0002-s/README.md";
    const readme = (p: number) => `---\ntitle: S\nstatus: active\npriority: ${p}\n---\n\nbody\n`;

    writeFileSync(join(dir, rel), readme(5));
    await ingestRfcForTest(dir, rel, "0002-s");
    expect((await Rfc.findBy({ id: "0002-s" }))!.priority).toBe(5);

    await setRfcPriority("0002-s", 2);
    writeFileSync(join(dir, rel), readme(9));
    await ingestRfcForTest(dir, rel, "0002-s");

    expect((await Rfc.findBy({ id: "0002-s" }))!.priority).toBe(2);
  });

  it("clears back to null in the README when cleared", async () => {
    const dir = mkdtempSync(join(tmpdir(), "tasks-rfcprio-"));
    mkdirSync(join(dir, "rfcs/0001-r"), { recursive: true });
    const rel = "rfcs/0001-r/README.md";
    writeFileSync(join(dir, rel), "---\ntitle: R\nstatus: active\npriority: 3\n---\n\nbody\n");
    await Rfc.where({ id: "0001-r" }).updateAll({ priority: 3, file_path: rel });

    await setRfcPriority("0001-r", null);
    await exportState({ tasksDir: dir, commit: false });

    expect((await Rfc.findBy({ id: "0001-r" }))!.priority).toBeNull();
    expect(readFileSync(join(dir, rel), "utf8")).toContain("priority: null");
  });

  it("rejects a negative or non-integer priority", async () => {
    await expect(setRfcPriority("0001-r", -1)).rejects.toThrow();
    await expect(setRfcPriority("0001-r", 1.5)).rejects.toThrow();
  });

  it("rejects an RFC that does not exist", async () => {
    await expect(setRfcPriority("9999-nope", 1)).rejects.toThrow();
    expect((await Event.where({ verb: "rfc-priority" }).count()) as number).toBe(0);
  });
});
