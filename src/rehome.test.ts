/**
 * Rehome moves the FILE, not just the row. Writing `rfc_id` alone would leave
 * `file_path` under the old RFC, and the next ingest of that still-present
 * file would put the story straight back — so these tests assert on disk.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Base } from "@blazetrails/activerecord";
import { migrate } from "./migrator.js";
import { Rfc, Story } from "./models/index.js";
import { rehome } from "./rehome.js";
import { buildStoryContent } from "./authoring.js";

let dir: string;
const prevTasksDir = process.env.TASKS_DIR;

function git(args: string[]): string {
  return execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
}

function storyPath(rfc: string, id: string): string {
  return join("rfcs", rfc, "stories", `${id}.md`);
}

beforeEach(async () => {
  await Base.establishConnection({ adapter: "node-sqlite", database: ":memory:", pool: 1 });
  await migrate();
  for (const t of ["events", "stories", "rfcs"]) {
    await Base.connection.execute(`DELETE FROM ${t}`);
  }

  dir = mkdtempSync(join(tmpdir(), "rehome-"));
  process.env.TASKS_DIR = dir;
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.email", "t@example.com"]);
  git(["config", "user.name", "t"]);

  const rel = storyPath("0001-from", "s1");
  mkdirSync(join(dir, "rfcs", "0001-from", "stories"), { recursive: true });
  mkdirSync(join(dir, "rfcs", "0123-holding", "stories"), { recursive: true });
  writeFileSync(
    join(dir, rel),
    buildStoryContent("0001-from", "s1", { date: "2026-09-02", status: "draft" }),
  );
  git(["add", "-A"]);
  git(["commit", "-q", "-m", "seed"]);

  await Rfc.create({ id: "0001-from", status: "active", title: "From" });
  await Rfc.create({ id: "0123-holding", status: "active", title: "Holding" });
  await Story.create({ id: "s1", rfc_id: "0001-from", status: "draft", file_path: rel });
});

afterEach(() => {
  if (prevTasksDir === undefined) delete process.env.TASKS_DIR;
  else process.env.TASKS_DIR = prevTasksDir;
});

describe("rehome", () => {
  it("moves the file and rewrites its rfc frontmatter", async () => {
    const r = await rehome(["s1"], "0123-holding", { commit: false });

    expect(r.moved).toEqual([
      { id: "s1", from: storyPath("0001-from", "s1"), to: storyPath("0123-holding", "s1") },
    ]);
    expect(existsSync(join(dir, storyPath("0001-from", "s1")))).toBe(false);
    const moved = readFileSync(join(dir, storyPath("0123-holding", "s1")), "utf8");
    expect(moved).toContain('rfc: "0123-holding"');
    // Rehoming is not a status change: the story arrives in its new home in
    // exactly the state it left, for the sunset agent to decide on there.
    expect(moved).toContain("status: draft");
  });

  it("is a no-op for a story already under the destination", async () => {
    const r = await rehome(["s1"], "0001-from", { commit: false });
    expect(r.moved).toEqual([]);
    expect(existsSync(join(dir, storyPath("0001-from", "s1")))).toBe(true);
  });

  it("refuses a terminal destination rather than reddening validate on main", async () => {
    await Rfc.create({ id: "0099-done", status: "closed", title: "Done" });
    await expect(rehome(["s1"], "0099-done", { commit: false })).rejects.toMatchObject({ code: 1 });
    expect(existsSync(join(dir, storyPath("0001-from", "s1")))).toBe(true);
  });

  it("refuses the whole batch when any id is unknown", async () => {
    await expect(rehome(["s1", "nope"], "0123-holding", { commit: false })).rejects.toMatchObject({
      code: 1,
    });
    expect(existsSync(join(dir, storyPath("0001-from", "s1")))).toBe(true);
  });
});
