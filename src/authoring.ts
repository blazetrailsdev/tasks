/**
 * Authoring: creating a story.
 *
 * Creation is a MARKDOWN act, not a database one. A new story is prose —
 * context, acceptance criteria, verification — and it goes through git so it can
 * be reviewed like any other writing. The row appears because `ingest` sees the
 * new file, which keeps ingest the single creator of rows.
 *
 * So `tasks new` writes a file, commits it, and runs ingest. It does NOT insert
 * a row directly. That is what lets `tasks new X` be followed immediately by
 * `tasks claim X` without giving authoring a second path into the database that
 * could disagree with the first.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { Rfc } from "./models/index.js";
import { resolveTasksDir } from "./db-path.js";
import { VerbExit } from "./db.js";
import type { StoryStatus } from "./models/index.js";

/** Escape for a YAML double-quoted scalar: backslash first, then quote. */
const qs = (s: string): string => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

export interface NewStoryOpts {
  title?: string;
  status?: StoryStatus;
  cluster?: string | null;
  packages?: string[];
  estLoc?: number | null;
  deps?: string[];
  priority?: number | null;
  body?: string;
  date: string;
}

/**
 * Render a story file.
 *
 * Ported from the old CLI's buildStoryContent so new files are identical in
 * shape to the 7,220 already in the tree — same key order, same quoting, same
 * `null` spellings. Anything else shows up as churn the first time prettier or
 * an export touches the file.
 */
export function buildStoryContent(rfcSlug: string, storySlug: string, opts: NewStoryOpts): string {
  const title = opts.title ?? storySlug;
  const deps = opts.deps ?? [];
  const depsYaml = deps.length === 0 ? "[]" : `[${deps.map(qs).join(", ")}]`;
  const packages = opts.packages ?? [];
  const packagesYaml = packages.length === 0 ? "[]" : `[${packages.map(qs).join(", ")}]`;
  const body =
    opts.body != null
      ? `\n${opts.body.replace(/^\n+/, "").replace(/\n+$/, "")}\n`
      : "\n## Context\n\n## Acceptance criteria\n\n## Definition of done\n\n## Verification\n";

  return `---
title: ${qs(title)}
status: ${opts.status ?? "draft"}
updated: ${opts.date}
rfc: ${qs(rfcSlug)}
cluster: ${opts.cluster != null ? opts.cluster : "null"}
packages: ${packagesYaml}
deps: ${depsYaml}
deps-rfc: []
est-loc: ${opts.estLoc != null ? opts.estLoc : "null"}
priority: ${opts.priority != null ? opts.priority : "null"}
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---
${body}`;
}

export interface NewStoryResult {
  path: string;
  committed: boolean;
}

/**
 * Create a story: write the file, commit it, and let ingest create the row.
 *
 * `status` defaults to draft. `ready` is honored only when the parent RFC is
 * active — otherwise a new story under a draft RFC would be immediately
 * claimable, which the lifecycle forbids and the ready queue would filter out
 * anyway.
 */
export async function newStory(
  rfcSlug: string,
  storySlug: string,
  opts: Partial<Omit<NewStoryOpts, "date">> & { commit?: boolean } = {},
): Promise<NewStoryResult> {
  const tasksDir = resolveTasksDir();

  const rfc = await Rfc.findBy({ id: rfcSlug });
  if (!rfc) {
    console.error(`error: no such RFC "${rfcSlug}"`);
    throw new VerbExit(1);
  }

  const status: StoryStatus = opts.status ?? "draft";
  if (status === "ready" && rfc.status !== "active") {
    console.error(
      `error: cannot create "${storySlug}" as ready — RFC ${rfcSlug} is ${rfc.status}, not active`,
    );
    throw new VerbExit(1);
  }

  const rel = join("rfcs", rfcSlug, "stories", `${storySlug}.md`);
  const abs = join(tasksDir, rel);
  if (existsSync(abs)) {
    console.error(`error: ${rel} already exists`);
    throw new VerbExit(1);
  }

  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(
    abs,
    buildStoryContent(rfcSlug, storySlug, {
      ...opts,
      status,
      date: new Date().toISOString().slice(0, 10),
    }),
  );

  let committed = false;
  if (opts.commit !== false) {
    const git = (args: string[]): string =>
      execFileSync("git", args, { cwd: tasksDir, encoding: "utf8" }).trim();
    // Stage only this file — never `git add -A`, which would sweep up an
    // agent's in-flight edits sitting in the same worktree.
    git(["add", "--", rel]);
    git(["commit", "-q", "-m", `new: ${rfcSlug}/${storySlug}`]);
    committed = true;
  }

  return { path: rel, committed };
}
