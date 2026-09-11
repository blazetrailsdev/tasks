/**
 * `tasks new` must not depend on which branch the main checkout has. It used to
 * refuse whenever someone had that checkout on a branch, and agents fell back
 * to hand-authoring story files.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Base } from "@blazetrails/activerecord";
import { migrate } from "./migrator.js";
import { Rfc } from "./models/index.js";
import { newStory } from "./authoring.js";

let dir: string;
let origin: string;
const prevTasksDir = process.env.TASKS_DIR;

const git = (cwd: string, args: string[]): string =>
  execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

beforeEach(async () => {
  await Base.establishConnection({ adapter: "node-sqlite", database: ":memory:", pool: 1 });
  await migrate();
  for (const t of ["events", "stories", "rfcs"]) {
    await Base.connection.execute(`DELETE FROM ${t}`);
  }

  origin = mkdtempSync(join(tmpdir(), "new-origin-"));
  git(origin, ["init", "-q", "--bare", "-b", "main"]);
  dir = mkdtempSync(join(tmpdir(), "new-"));
  process.env.TASKS_DIR = dir;
  git(dir, ["init", "-q", "-b", "main"]);
  git(dir, ["config", "user.email", "t@example.com"]);
  git(dir, ["config", "user.name", "t"]);
  mkdirSync(join(dir, "rfcs", "0001-a", "stories"), { recursive: true });
  writeFileSync(join(dir, "rfcs", "0001-a", "README.md"), "# A\n");
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-q", "-m", "seed"]);
  git(dir, ["remote", "add", "origin", origin]);
  git(dir, ["push", "-q", "origin", "main"]);

  await Rfc.create({ id: "0001-a", status: "active", title: "A" });
});

afterEach(() => {
  if (prevTasksDir === undefined) delete process.env.TASKS_DIR;
  else process.env.TASKS_DIR = prevTasksDir;
});

describe("newStory", () => {
  it("lands on origin/main even when the main checkout is on another branch", async () => {
    git(dir, ["checkout", "-q", "-b", "someone-elses-branch"]);

    const r = await newStory("0001-a", "s1", { title: "S1" });

    expect(r).toEqual({ path: "rfcs/0001-a/stories/s1.md", committed: true });
    expect(git(origin, ["show", "main:rfcs/0001-a/stories/s1.md"])).toContain('title: "S1"');
    // The checkout it didn't need is left exactly as it was.
    expect(git(dir, ["rev-parse", "--abbrev-ref", "HEAD"])).toBe("someone-elses-branch");
    expect(existsSync(join(dir, "rfcs/0001-a/stories/s1.md"))).toBe(false);
    // And the scratch worktree is gone.
    expect(git(dir, ["worktree", "list"]).split("\n")).toHaveLength(1);
  });

  it("refuses a slug that already exists on main", async () => {
    await newStory("0001-a", "s1");
    await expect(newStory("0001-a", "s1")).rejects.toMatchObject({ code: 1 });
  });
});
