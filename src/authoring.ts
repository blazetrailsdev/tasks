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
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { Rfc } from "./models/index.js";
import { currentBranch, mainWorktree } from "./db-path.js";
import { VerbExit } from "./db.js";
import { pushMain } from "./export.js";
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
  // Author into the MAIN working tree, never the caller's worktree.
  //
  // Workers run `tasks new` from a trails worktree to file findings after their
  // PR merges (the post-merge-findings flow). Committing that into the worktree
  // puts the story on a feature branch that has ALREADY merged and never will
  // again — the finding is stranded, and ingest either misses it or, worse,
  // publishes an unmerged row into the shared DB.
  //
  // The old CLI avoided this by refusing to run outside main. Same intent here,
  // achieved by writing where the story actually belongs.
  const tasksDir = mainWorktree();
  const branch = currentBranch(tasksDir);
  if (branch !== "main") {
    console.error(
      `error: ${tasksDir} is on ${branch ?? "a detached HEAD"}, not main — refusing to author.\n` +
        `  New stories must land on main or they are stranded on a dead branch.`,
    );
    throw new VerbExit(1);
  }

  const rfc = await Rfc.findBy({ id: rfcSlug });
  if (!rfc) {
    console.error(`error: no such RFC "${rfcSlug}"`);
    throw new VerbExit(1);
  }

  // A terminal RFC cannot take new work. validate() rejects a closed RFC that
  // holds an unfinished story, so filing one here does not just look odd — it
  // turns main's CI red for everyone. This happened: post-merge-findings picked
  // a "best-fit" RFC that had already been auto-closed, and the resulting draft
  // story broke validate on main.
  //
  // Reopen the RFC first if the work genuinely belongs to it, or pick another.
  if (rfc.status === "closed" || rfc.status === "superseded") {
    console.error(
      `error: RFC ${rfcSlug} is ${rfc.status} — it cannot take new stories.\n` +
        `  A ${rfc.status} RFC holding an unfinished story fails \`pnpm validate\`, which is a\n` +
        `  CI failure on main. Reopen it if this work belongs there, or file under\n` +
        `  another active RFC (0023-surfaced-deviations is the catch-all).`,
    );
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

  // Catch a bad-markdown body HERE, at authoring time, not on main's CI. This is
  // the same `.markdownlint-cli2.jsonc` config `pnpm lint` runs against the
  // whole repo, scoped to just the file just written so `tasks new` stays fast.
  // A bare-``` fence (MD040) or a `#NNNN` PR reference misread as a heading
  // (MD018) is exactly the recurring pattern that reds `pnpm lint` on main —
  // reject it before it is committed, rather than baselining or disabling the
  // rule once main is already red.
  try {
    execFileSync("node_modules/.bin/markdownlint-cli2", [rel], { cwd: tasksDir, encoding: "utf8" });
  } catch (e) {
    rmSync(abs);
    const out = [(e as { stdout?: string }).stdout, (e as { stderr?: string }).stderr]
      .filter(Boolean)
      .join("\n");
    console.error(`error: ${rel} fails markdownlint — story not written.\n\n${out}`);
    throw new VerbExit(1);
  }

  let committed = false;
  if (opts.commit !== false) {
    const git = (args: string[]): string =>
      execFileSync("git", args, { cwd: tasksDir, encoding: "utf8" }).trim();
    // Stage only this file — never `git add -A`, which would sweep up an
    // agent's in-flight edits sitting in the same worktree.
    git(["add", "--", rel]);
    git(["commit", "-q", "-m", `new: ${rfcSlug}/${storySlug}`]);
    // Push, or the story exists only on this host: invisible on github.com, and
    // the local/origin drift eventually orphans the ingest watermark.
    pushMain(git, "tasks new");
    committed = true;
  }

  return { path: rel, committed };
}
