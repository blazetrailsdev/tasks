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
import { Rfc, Story } from "./models/index.js";
import { setPriority } from "./verbs.js";
import { exportState } from "./export.js";
import { DB_OWNED, MARKDOWN_OWNED } from "./ingest.js";

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
