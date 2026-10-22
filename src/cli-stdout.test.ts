/**
 * The CLI ends in `process.exit`, which discards whatever stdout still holds.
 * A write to a file is synchronous and a write to a pipe is not, so
 * `tasks list --json | jq` used to get the first 64 KiB and a truncated
 * document while `> file` got all of it — and every consumer that piped the
 * CLI into a parser saw invalid JSON.
 */
import { describe, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { promisify } from "node:util";

const root = fileURLToPath(new URL("..", import.meta.url));

describe("the CLI's stdout", () => {
  it("reaches a pipe whole", async () => {
    const { stdout } = await promisify(execFile)(join(root, "bin", "tasks"), ["list", "--json"], {
      maxBuffer: 256 * 1024 * 1024,
    });
    expect(stdout.length).toBeGreaterThan(64 * 1024);
    expect(() => JSON.parse(stdout)).not.toThrow();
    expect(Array.isArray(JSON.parse(stdout))).toBe(true);
  }, 120_000);
});
