/**
 * `assertMarkdownlintClean` is the guard `newStory` calls right after writing
 * a story file and before committing it. These tests call the exported guard
 * directly — the actual shipped function, not a re-implementation of its
 * logic — against generated story content, covering the two shapes that
 * actually caused the recurrence this fixes: a bare ``` fence, and a line
 * starting `#NNNN` misread as a heading.
 */
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { assertMarkdownlintClean, assertValidateClean, buildStoryContent } from "./authoring.js";
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

/**
 * `assertValidateClean` runs validate's story rules against the one file
 * `newStory` just wrote. A tree with a second RFC already holding `x` is the
 * shape that put seven `x.md` duplicates on main.
 */
describe("assertValidateClean (the tasks-new validate gate)", () => {
  function tree(): string {
    const dir = mkdtempSync(join(tmpdir(), "tasks-validate-gate-"));
    for (const rfc of ["0001-a", "0002-b"]) {
      mkdirSync(join(dir, "rfcs", rfc, "stories"), { recursive: true });
      writeFileSync(
        join(dir, "rfcs", rfc, "README.md"),
        `---\nrfc: "${rfc}"\ntitle: "T"\nstatus: active\ncreated: 2026-09-01\n` +
          `updated: 2026-09-01\nowner: "@o"\npackages: ["activerecord"]\nclusters: []\n---\n`,
      );
    }
    writeFileSync(
      join(dir, "rfcs", "0001-a", "stories", "x.md"),
      buildStoryContent("0001-a", "x", { date: "2026-09-01" }),
    );
    return dir;
  }
  const write = (dir: string, slug: string, opts: { packages?: string[] } = {}) => {
    const rel = join("rfcs", "0002-b", "stories", `${slug}.md`);
    writeFileSync(
      join(dir, rel),
      buildStoryContent("0002-b", slug, { ...opts, date: "2026-09-01" }),
    );
    return { abs: join(dir, rel), rel };
  };

  it("leaves a story that validates clean in place", () => {
    const dir = tree();
    try {
      const { abs, rel } = write(dir, "story-one", { packages: ["activerecord"] });
      expect(() => assertValidateClean(abs, rel, dir)).not.toThrow();
      expect(existsSync(abs)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it.each([
    ["an id another RFC already uses", "x", {}],
    ["a package its RFC does not declare", "story-one", { packages: ["activesupport"] }],
  ])("deletes the file and throws VerbExit(1) for %s", (_what, slug, opts) => {
    const dir = tree();
    try {
      const { abs, rel } = write(dir, slug, opts);
      expect(() => assertValidateClean(abs, rel, dir)).toThrow(VerbExit);
      expect(existsSync(abs)).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
