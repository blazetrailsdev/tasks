/**
 * The CLI ends in `process.exit`, which discards whatever stdout still holds.
 * A write to a file is synchronous and a write to a pipe is not, so
 * `tasks list --json | jq` used to get the first 64 KiB and a truncated
 * document while `> file` got all of it — and every consumer that piped the
 * CLI into a parser saw invalid JSON.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { promisify } from "node:util";
import { Base } from "@blazetrails/activerecord";
import { migrate } from "./migrator.js";
import { Rfc, Story } from "./models/index.js";

const root = fileURLToPath(new URL("..", import.meta.url));

// CI has no shared `.git/tasks.db`, so the CLI reads a seeded file of its own,
// large enough that the `--json` document overruns one 64 KiB pipe buffer.
const database = join(mkdtempSync(join(tmpdir(), "cli-stdout-")), "tasks.db");

beforeAll(async () => {
  await Base.establishConnection({ adapter: "node-sqlite", database, pool: 1 });
  await migrate();
  await Rfc.create({ id: "0001-r", status: "active", title: "R" });
  for (let i = 0; i < 1000; i++) {
    await Story.create({
      id: `story-${i}`,
      rfc_id: "0001-r",
      status: "ready",
      title: "x".repeat(100),
    });
  }
  await Base.connection.disconnect?.();
});

describe("the CLI's stdout", () => {
  it("reaches a pipe whole", async () => {
    const { stdout } = await promisify(execFile)(join(root, "bin", "tasks"), ["list", "--json"], {
      maxBuffer: 256 * 1024 * 1024,
      env: { ...process.env, TASKS_DB: database },
    });
    expect(stdout.length).toBeGreaterThan(64 * 1024);
    expect(() => JSON.parse(stdout)).not.toThrow();
    expect(Array.isArray(JSON.parse(stdout))).toBe(true);
  }, 120_000);
});
