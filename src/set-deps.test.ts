/**
 * set-deps rewrites the story FILE — deps are markdown-owned, so a row-only
 * write would be reverted by the next ingest. These tests assert on disk and on
 * git, since a refusal must leave both untouched.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Base } from "@blazetrails/activerecord";
import { migrate } from "./migrator.js";
import { Rfc, Story } from "./models/index.js";
import { applyDepsEdit, setDeps } from "./set-deps.js";
import { buildStoryContent } from "./authoring.js";

let dir: string;
const prevTasksDir = process.env.TASKS_DIR;

function git(args: string[]): string {
  return execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
}

const storyPath = (id: string): string => join("rfcs", "0001-x", "stories", `${id}.md`);
const read = (id: string): string => readFileSync(join(dir, storyPath(id)), "utf8");

beforeEach(async () => {
  await Base.establishConnection({ adapter: "node-sqlite", database: ":memory:", pool: 1 });
  await migrate();
  for (const t of ["events", "stories", "rfcs"]) {
    await Base.connection.execute(`DELETE FROM ${t}`);
  }

  dir = mkdtempSync(join(tmpdir(), "set-deps-"));
  process.env.TASKS_DIR = dir;
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.email", "t@example.com"]);
  git(["config", "user.name", "t"]);

  mkdirSync(join(dir, "rfcs", "0001-x", "stories"), { recursive: true });
  mkdirSync(join(dir, "rfcs", "0002-y"), { recursive: true });
  for (const rfc of ["0001-x", "0002-y"]) {
    writeFileSync(
      join(dir, "rfcs", rfc, "README.md"),
      `---\nrfc: "${rfc}"\ntitle: "T"\nstatus: active\ncreated: 2026-09-01\n` +
        `updated: 2026-09-01\nowner: "@o"\npackages: []\nclusters: []\n---\n`,
    );
    await Rfc.create({ id: rfc, status: "active", title: "T" });
  }
  // a -> b; c stands alone.
  for (const [id, deps] of [
    ["a", ["b"]],
    ["b", []],
    ["c", []],
  ] as const) {
    writeFileSync(
      join(dir, storyPath(id)),
      buildStoryContent("0001-x", id, { date: "2026-09-02", status: "draft", deps: [...deps] }),
    );
    await Story.create({ id, rfc_id: "0001-x", status: "draft", file_path: storyPath(id) });
  }
  git(["add", "-A"]);
  git(["commit", "-q", "-m", "seed"]);
});

afterEach(() => {
  if (prevTasksDir === undefined) delete process.env.TASKS_DIR;
  else process.env.TASKS_DIR = prevTasksDir;
});

describe("applyDepsEdit", () => {
  it("appends de-duplicated, preserving existing order, and removes", () => {
    expect(applyDepsEdit(["x", "y"], { add: ["z", "x", "z"] })).toEqual(["x", "y", "z"]);
    expect(applyDepsEdit(["x", "y", "z"], { remove: ["y"] })).toEqual(["x", "z"]);
    expect(applyDepsEdit(["x"], { add: ["y"], remove: ["x"] })).toEqual(["y"]);
    expect(applyDepsEdit(["x"], { set: [] })).toEqual([]);
  });
});

describe("set-deps", () => {
  it("replaces deps, commits as set-deps: <id>, and ingests the new edge", async () => {
    const r = await setDeps("c", "deps", { set: ["a", "b"] });
    expect(r).toEqual({ from: [], to: ["a", "b"], committed: true });
    expect(read("c")).toContain("deps:\n  - a\n  - b\n");
    expect(git(["log", "-1", "--format=%s"])).toBe("set-deps: c");
    expect(git(["show", "--name-only", "--format=", "HEAD"])).toBe(storyPath("c"));
    const c = await Story.findBy({ id: "c" });
    expect((await c!.deps.toArray()).map((d) => d.id).sort()).toEqual(["a", "b"]);
  });

  it("clears the array with an empty csv", async () => {
    await setDeps("a", "deps", { set: [] }, { commit: false });
    expect(read("a")).toContain("deps: []\n");
  });

  it("--add appends to the existing list", async () => {
    await setDeps("a", "deps", { add: ["c", "b"] }, { commit: false });
    expect(read("a")).toContain("deps:\n  - b\n  - c\n");
  });

  it("--remove drops from the existing list", async () => {
    await setDeps("a", "deps", { remove: ["b"] }, { commit: false });
    expect(read("a")).toContain("deps: []\n");
  });

  it("sets deps-rfc and commits as set-deps-rfc: <id>", async () => {
    await setDeps("a", "deps-rfc", { add: ["0002-y"] });
    expect(read("a")).toContain("deps-rfc:\n  - 0002-y\n");
    expect(git(["log", "-1", "--format=%s"])).toBe("set-deps-rfc: a");
  });

  it("is a no-op, with no commit, when nothing changes", async () => {
    const head = git(["rev-parse", "HEAD"]);
    const r = await setDeps("a", "deps", { add: ["b"] });
    expect(r.committed).toBe(false);
    expect(git(["rev-parse", "HEAD"])).toBe(head);
  });

  describe("refusals change no file and make no commit", () => {
    let head: string;
    let before: string;
    beforeEach(() => {
      head = git(["rev-parse", "HEAD"]);
      before = read("b");
    });
    afterEach(() => {
      expect(read("b")).toBe(before);
      expect(git(["rev-parse", "HEAD"])).toBe(head);
      expect(git(["status", "--porcelain"])).toBe("");
    });

    it("refuses an unknown story reference", async () => {
      await expect(setDeps("b", "deps", { add: ["nope"] })).rejects.toMatchObject({ code: 1 });
    });

    it("refuses an unknown RFC reference", async () => {
      await expect(setDeps("b", "deps-rfc", { set: ["0099-nope"] })).rejects.toMatchObject({
        code: 1,
      });
    });

    it("refuses a change that introduces a cycle", async () => {
      await expect(setDeps("b", "deps", { add: ["a"] })).rejects.toMatchObject({ code: 1 });
    });

    it("refuses a self-dependency", async () => {
      await expect(setDeps("b", "deps", { set: ["b"] })).rejects.toMatchObject({ code: 1 });
    });
  });

  it("refuses an unknown story id", async () => {
    await expect(setDeps("nope", "deps", { set: [] })).rejects.toMatchObject({ code: 1 });
  });
});
