import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";

export const CANONICAL_TASKS_DIR = join(homedir(), "github", "blazetrailsdev", "tasks");

// Ported from the old CLI (scripts/cli.ts:1097). A worktree's `.git` is a FILE
// pointing at the shared common dir; the canonical checkout's is a directory.
// Resolving through it is what makes every worktree — and the bind-mounted
// container — agree on one path.
export function gitCommonDir(dir: string): string {
  const dotgit = join(dir, ".git");
  if (statSync(dotgit).isDirectory()) return dotgit;
  const gitdir = resolve(
    dir,
    readFileSync(dotgit, "utf8")
      .replace(/^gitdir:\s*/, "")
      .trim(),
  );
  // A linked worktree's gitdir is <common>/worktrees/<name>; commondir points back.
  const commonFile = join(gitdir, "commondir");
  if (existsSync(commonFile)) {
    return resolve(gitdir, readFileSync(commonFile, "utf8").trim());
  }
  return gitdir;
}

const envDir = (v: string | undefined): string | undefined => {
  const t = v?.trim();
  return t ? t : undefined;
};

// A git working tree with this repo's shape at its root.
function isTasksCheckout(dir: string): boolean {
  return existsSync(join(dir, ".git")) && existsSync(join(dir, "rfcs"));
}

export function enclosingTasksCheckout(cwd: string): string | undefined {
  let dir = resolve(cwd);
  for (;;) {
    if (isTasksCheckout(dir)) return dir;
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

export function resolveTasksDir(cwd = process.cwd()): string {
  const explicit = envDir(process.env.TASKS_DIR);
  if (explicit) return explicit;
  const local = join(cwd, "tasks");
  if (existsSync(join(local, ".git"))) return local;
  return enclosingTasksCheckout(cwd) ?? CANONICAL_TASKS_DIR;
}

/**
 * The one SQLite file every worktree, every agent, and the btwhooks container
 * share. It lives in the git common dir — not the working tree — because that
 * is the only directory that is already identical across all of them.
 *
 * Deliberately NOT committed: a tracked binary DB would make one `claim`
 * rewrite an unmergeable blob and turn concurrent claims into merge conflicts,
 * which is strictly worse than the push races we're replacing.
 */
export function resolveDbPath(cwd = process.cwd()): string {
  const explicit = envDir(process.env.TASKS_DB);
  if (explicit) return explicit;
  const tasksDir = resolveTasksDir(cwd);
  try {
    return join(gitCommonDir(tasksDir), "tasks.db");
  } catch {
    return join(tasksDir, "tasks.db");
  }
}

/**
 * The MAIN working tree of the shared clone — the one the database mirrors.
 *
 * The database is global: every worktree resolves it through gitCommonDir, so
 * there is exactly one. What it holds must therefore be exactly one thing —
 * the state of `main`. Reading a feature branch into it publishes unmerged
 * stories to every agent on the host.
 *
 * That happened: an agent authoring an RFC on a PR branch ran ingest from its
 * worktree, and 1 RFC + 10 unmerged stories appeared in the canonical DB. The
 * ready queue was spared only because claimable() requires an active RFC and
 * the placeholder was still `draft` — luck, not design.
 *
 * `git worktree list --porcelain` lists the main working tree first.
 */
export function mainWorktree(cwd = process.cwd()): string {
  const dir = resolveTasksDir(cwd);
  try {
    const out = execFileSync("git", ["worktree", "list", "--porcelain"], {
      cwd: dir,
      encoding: "utf8",
    });
    const first = out.split("\n").find((l) => l.startsWith("worktree "));
    if (first) return first.slice("worktree ".length).trim();
  } catch {
    /* not a git repo / git unavailable — fall through */
  }
  return dir;
}

/** The branch HEAD points at, or null when detached. */
export function currentBranch(dir: string): string | null {
  try {
    const b = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: dir,
      encoding: "utf8",
    }).trim();
    return b === "HEAD" ? null : b;
  } catch {
    return null;
  }
}

/** Current HEAD of the tasks checkout — the ingest watermark. */
export function headSha(tasksDir = resolveTasksDir()): string {
  return execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: tasksDir,
    encoding: "utf8",
  }).trim();
}
