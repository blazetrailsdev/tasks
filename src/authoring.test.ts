/**
 * `assertMarkdownlintClean` is the guard `newStory` calls right after writing
 * a story file and before committing it. These tests call the exported guard
 * directly — the actual shipped function, not a re-implementation of its
 * logic — against generated story content, covering the two shapes that
 * actually caused the recurrence this fixes: a bare ``` fence, and a line
 * starting `#NNNN` misread as a heading.
 */
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { assertMarkdownlintClean, buildStoryContent } from "./authoring.js";
import { VerbExit } from "./db.js";

const REPO_ROOT = join(import.meta.dirname, "..");

function writeStory(body: string): { abs: string; rel: string; dir: string } {
  const dir = mkdtempSync(join(tmpdir(), "tasks-lint-gate-"));
  const abs = join(dir, "story.md");
  writeFileSync(abs, buildStoryContent("some-rfc", "some-slug", { body, date: "2026-09-01" }));
  return { abs, rel: "story.md", dir };
}

describe("assertMarkdownlintClean (the tasks-new markdownlint gate)", () => {
  it("leaves the file in place for the default skeleton body", () => {
    const { abs, rel, dir } = writeStory(
      "## Context\n\n## Acceptance criteria\n\n## Definition of done\n\n## Verification\n",
    );
    try {
      expect(() => assertMarkdownlintClean(abs, rel, REPO_ROOT)).not.toThrow();
      expect(existsSync(abs)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("leaves the file in place for ordinary prose with a labeled fence", () => {
    const { abs, rel, dir } = writeStory("## Context\n\nSee below.\n\n```ts\nconst x = 1;\n```\n");
    try {
      expect(() => assertMarkdownlintClean(abs, rel, REPO_ROOT)).not.toThrow();
      expect(existsSync(abs)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("deletes the file and throws VerbExit(1) for a bare fence with no language (MD040)", () => {
    const { abs, rel, dir } = writeStory("## Context\n\n```\nsome output\n```\n");
    try {
      let thrown: unknown;
      try {
        assertMarkdownlintClean(abs, rel, REPO_ROOT);
      } catch (e) {
        thrown = e;
      }
      expect(thrown).toBeInstanceOf(VerbExit);
      expect((thrown as VerbExit).code).toBe(1);
      expect(existsSync(abs)).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("deletes the file and throws VerbExit(1) for a wrapped PR-reference line (MD018)", () => {
    const { abs, rel, dir } = writeStory(
      "## Context\n\nThis was fixed in PR\n#7317 which landed it.\n",
    );
    try {
      let thrown: unknown;
      try {
        assertMarkdownlintClean(abs, rel, REPO_ROOT);
      } catch (e) {
        thrown = e;
      }
      expect(thrown).toBeInstanceOf(VerbExit);
      expect((thrown as VerbExit).code).toBe(1);
      expect(existsSync(abs)).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
