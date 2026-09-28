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

const README_B = `---
rfc: "0002-b"
title: "B"
status: active
created: 2026-09-01
updated: 2026-09-01
owner: "@o"
packages:
  - "activerecord"
  # annotated, as 0142's is
clusters: ["boot"]
---

# B
`;

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
  // B declares its lists the way real READMEs do — a commented block list —
  // and C declares the names B lacks, so they are known vocabulary.
  mkdirSync(join(dir, "rfcs", "0002-b"), { recursive: true });
  writeFileSync(join(dir, "rfcs", "0002-b", "README.md"), README_B);
  mkdirSync(join(dir, "rfcs", "0003-c"), { recursive: true });
  writeFileSync(
    join(dir, "rfcs", "0003-c", "README.md"),
    README_B.replace(/0002-b/g, "0003-c")
      .replace('"activerecord"', '"ruby-compat"')
      .replace('"boot"', '"autoload"'),
  );
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-q", "-m", "seed"]);
  git(dir, ["remote", "add", "origin", origin]);
  git(dir, ["push", "-q", "origin", "main"]);

  await Rfc.create({ id: "0001-a", status: "active", title: "A" });
  await Rfc.create({ id: "0002-b", status: "active", title: "B" });
});

afterEach(() => {
  if (prevTasksDir === undefined) delete process.env.TASKS_DIR;
  else process.env.TASKS_DIR = prevTasksDir;
});

describe("newStory", () => {
  it("lands on origin/main even when the main checkout is on another branch", async () => {
    git(dir, ["checkout", "-q", "-b", "someone-elses-branch"]);

    const r = await newStory("0001-a", "story-one", { title: "S1" });

    expect(r).toEqual({ path: "rfcs/0001-a/stories/story-one.md", committed: true });
    expect(git(origin, ["show", "main:rfcs/0001-a/stories/story-one.md"])).toContain('title: "S1"');
    // The checkout it didn't need is left exactly as it was.
    expect(git(dir, ["rev-parse", "--abbrev-ref", "HEAD"])).toBe("someone-elses-branch");
    expect(existsSync(join(dir, "rfcs/0001-a/stories/story-one.md"))).toBe(false);
    // And the scratch worktree is gone.
    expect(git(dir, ["worktree", "list"]).split("\n")).toHaveLength(1);
  });

  it("refuses a slug that already exists on main", async () => {
    await newStory("0001-a", "story-one");
    await expect(newStory("0001-a", "story-one")).rejects.toMatchObject({ code: 1 });
  });

  it.each(["x", "zz", "Story-One", "single"])("refuses the degenerate slug %j", async (slug) => {
    await expect(newStory("0001-a", slug)).rejects.toMatchObject({ code: 1 });
    expect(git(origin, ["log", "--format=%s", "main"])).toBe("seed");
  });

  it("refuses a story that fails pnpm validate: an id another RFC already uses", async () => {
    await newStory("0001-a", "story-one");
    await expect(newStory("0002-b", "story-one")).rejects.toMatchObject({ code: 1 });
    expect(git(origin, ["ls-tree", "-r", "--name-only", "main", "rfcs/0002-b"])).toBe(
      "rfcs/0002-b/README.md",
    );
  });

  it("refuses a story that fails pnpm validate: a dep that does not exist", async () => {
    await expect(
      newStory("0002-b", "story-two", { deps: ["no-such-story"] }),
    ).rejects.toMatchObject({ code: 1 });
    expect(git(origin, ["log", "--format=%s", "main"])).toBe("seed");
  });

  it("widens the RFC's packages and clusters with a known name, in the story's commit", async () => {
    const r = await newStory("0002-b", "story-two", {
      packages: ["activerecord", "ruby-compat"],
      cluster: "autoload",
    });

    expect(r.committed).toBe(true);
    expect(git(origin, ["show", "--name-only", "--format=%s", "main"]).split("\n")).toEqual([
      "new: 0002-b/story-two",
      "",
      "rfcs/0002-b/README.md",
      "rfcs/0002-b/stories/story-two.md",
    ]);
    const readme = git(origin, ["show", "main:rfcs/0002-b/README.md"]);
    expect(readme).toContain(
      'packages:\n  - "activerecord"\n  # annotated, as 0142\'s is\n  - "ruby-compat"\nclusters:',
    );
    expect(readme).toContain('clusters:\n  - "boot"\n  - "autoload"\n---');
  });

  it("refuses to widen onto the RFC a package no RFC declares", async () => {
    await expect(
      newStory("0002-b", "story-two", { packages: ["rubby-compat"] }),
    ).rejects.toMatchObject({ code: 1 });
    expect(git(origin, ["log", "--format=%s", "main"])).toBe("seed");
  });
});
