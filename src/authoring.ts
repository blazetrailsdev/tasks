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
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { Rfc } from "./models/index.js";
import { resolveTasksDir } from "./db-path.js";
import { VerbExit } from "./db.js";
import { pushMain } from "./export.js";
import type { StoryStatus } from "./models/index.js";

/** Escape for a YAML double-quoted scalar: backslash first, then quote. */
const MARKDOWNLINT = join(import.meta.dirname, "..", "node_modules", ".bin", "markdownlint-cli2");

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
 * Catch a bad-markdown body HERE, at authoring time, not on main's CI. This is
 * the same `.markdownlint-cli2.jsonc` config `pnpm lint` runs against the
 * whole repo, scoped to just the file just written so `tasks new` stays fast.
 * A bare-``` fence (MD040) or a `#NNNN` PR reference misread as a heading
 * (MD018) is exactly the recurring pattern that reds `pnpm lint` on main —
 * reject it before it is committed, rather than baselining or disabling the
 * rule once main is already red.
 *
 * `abs` is deleted and a `VerbExit` thrown on failure — the story either
 * lands clean or not at all, matching every other guard in `newStory`.
 */
export function assertMarkdownlintClean(abs: string, rel: string, cwd: string): void {
  try {
    // The binary comes from this CLI's own install, not `cwd`: a scratch
    // worktree has the repo's lint config but no node_modules.
    execFileSync(MARKDOWNLINT, [abs], { cwd, encoding: "utf8" });
  } catch (e) {
    rmSync(abs);
    const out = [(e as { stdout?: string }).stdout, (e as { stderr?: string }).stderr]
      .filter(Boolean)
      .join("\n");
    console.error(`error: ${rel} fails markdownlint — story not written.\n\n${out}`);
    throw new VerbExit(1);
  }
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
  const content = buildStoryContent(rfcSlug, storySlug, {
    ...opts,
    status,
    date: new Date().toISOString().slice(0, 10),
  });

  // Author against origin/main in a throwaway worktree, never the caller's
  // worktree and never the main checkout's.
  //
  // Workers run `tasks new` from a feature worktree to file findings after
  // their PR merges. Committing there strands the story on a branch that has
  // already merged. The fix used to be "write into the main checkout, and
  // refuse unless it is on main" — but the main checkout is just another
  // working tree, and whenever someone had it on a branch every agent's
  // `tasks new` failed, and they fell back to hand-authoring story files.
  // A detached scratch worktree at origin/main needs nobody's checkout.
  return withMainScratch((dir) => {
    const abs = join(dir, rel);
    if (existsSync(abs)) {
      console.error(`error: ${rel} already exists`);
      throw new VerbExit(1);
    }
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
    assertMarkdownlintClean(abs, rel, dir);

    if (opts.commit === false) {
      // Nothing to land; hand back a copy the caller can inspect, since the
      // scratch tree is about to be removed.
      console.log(content);
      return { path: rel, committed: false };
    }
    const git = (args: string[]): string =>
      execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
    git(["add", "--", rel]);
    git(["commit", "-q", "-m", `new: ${rfcSlug}/${storySlug}`]);
    // Push, or the story exists only in a worktree that is about to vanish.
    pushMain(git, "tasks new");
    return { path: rel, committed: true };
  });
}

/**
 * Run `fn` in a temporary detached worktree of the tasks clone at origin/main,
 * then remove it. Its commits survive as long as `fn` pushed them.
 */
export function withMainScratch<T>(fn: (dir: string) => T): T {
  const repo = resolveTasksDir();
  const git = (args: string[]): string =>
    execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  try {
    git(["fetch", "--quiet", "origin", "main"]);
  } catch (e) {
    console.error(`warning: could not fetch origin/main: ${(e as Error).message}`);
  }
  const base = hasRef(git, "origin/main") ? "origin/main" : "main";
  const dir = mkdtempSync(join(tmpdir(), "tasks-new-"));
  git(["worktree", "add", "--quiet", "--detach", dir, base]);
  // The tracked pre-commit hook fails closed without node_modules/.bin/lint-staged,
  // and a fresh worktree has none — so every `tasks new` commit was refused.
  const modules = join(repo, "node_modules");
  if (existsSync(modules)) symlinkSync(modules, join(dir, "node_modules"), "dir");
  try {
    return fn(dir);
  } finally {
    try {
      git(["worktree", "remove", "--force", dir]);
    } catch {
      rmSync(dir, { recursive: true, force: true });
      git(["worktree", "prune"]);
    }
  }
}

function hasRef(git: (args: string[]) => string, ref: string): boolean {
  try {
    git(["rev-parse", "--verify", "--quiet", ref]);
    return true;
  } catch {
    return false;
  }
}
