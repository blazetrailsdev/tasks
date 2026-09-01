/**
 * `newStory`'s markdownlint gate lints the exact file it is about to commit,
 * against the repo's real `.markdownlint-cli2.jsonc`. These tests exercise
 * that check directly on generated content rather than through the full
 * `newStory` git/push flow (which needs a real `mainWorktree()` + `origin`),
 * so they catch the case that actually caused the recurrence this fixes: a
 * body shaped like the two most common offenders — a bare ``` fence, and a
 * line starting `#NNNN` misread as a heading.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildStoryContent } from "./authoring.js";

const REPO_ROOT = join(import.meta.dirname, "..");

function lint(body: string): { ok: boolean; output: string } {
  const dir = mkdtempSync(join(tmpdir(), "tasks-lint-gate-"));
  const file = join(dir, "story.md");
  writeFileSync(file, buildStoryContent("some-rfc", "some-slug", { body, date: "2026-09-01" }));
  try {
    execFileSync("node_modules/.bin/markdownlint-cli2", [file], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });
    return { ok: true, output: "" };
  } catch (e) {
    return {
      ok: false,
      output: [(e as { stdout?: string }).stdout, (e as { stderr?: string }).stderr].join("\n"),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("the markdownlint gate newStory runs before committing", () => {
  it("passes the default skeleton body", () => {
    expect(
      lint("## Context\n\n## Acceptance criteria\n\n## Definition of done\n\n## Verification\n").ok,
    ).toBe(true);
  });

  it("passes ordinary prose with a labeled fence", () => {
    const body = "## Context\n\nSee below.\n\n```ts\nconst x = 1;\n```\n";
    expect(lint(body).ok).toBe(true);
  });

  it("rejects a bare fence with no language (MD040)", () => {
    const body = "## Context\n\n```\nsome output\n```\n";
    const { ok, output } = lint(body);
    expect(ok).toBe(false);
    expect(output).toContain("MD040");
  });

  it("rejects a wrapped line starting with a PR reference (MD018)", () => {
    const body = "## Context\n\nThis was fixed in PR\n#7317 which landed it.\n";
    const { ok, output } = lint(body);
    expect(ok).toBe(false);
    expect(output).toContain("MD018");
  });
});
