/**
 * Export: DB → git, for DB-owned fields only.
 *
 * Runs on a timer (hourly), NEVER in the mutation path. That separation is the
 * whole reason the old repo's 27k status-flip commits go away: a claim writes
 * one row and returns; an hour later one batched commit carries whatever
 * changed. Stories stay readable and greppable on github.com, and state has a
 * durable plaintext backup, without a commit per claim.
 *
 * ANTI-PING-PONG: export writes only DB-owned fields, and ingest reads only
 * markdown-owned ones. So export's own commits are inert to ingest — it sees
 * nothing it cares about, advances the watermark, and stops. Verified by test,
 * because this is the property that makes the two directions safe to run
 * unattended.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Story } from "./models/index.js";
import { resolveTasksDir } from "./db-path.js";
import { editFrontmatter } from "./frontmatter.js";

export interface ExportResult {
  changed: string[];
  committed: boolean;
  sha: string | null;
}

/**
 * Render a DB value back into frontmatter, matching the old CLI's quoting
 * EXACTLY, field by field.
 *
 * This is not cosmetic. The repo's 7,164 story files use bare scalars for
 * `status`/`updated`/`pr` and double-quoted strings for `claim`/`assignee`/
 * `blocked-by`/`closed-reason` — the shapes the old CLI's editFrontmatter
 * wrote. Quote something it left bare and the first export rewrites EVERY file
 * instead of the handful that actually changed, burying real state churn in a
 * 7k-file reformat and defeating the "quiet hour produces no commit" property.
 */
const BARE_FIELDS = new Set(["status", "updated", "pr"]);

function render(field: string, value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return String(value);
  return BARE_FIELDS.has(field) ? String(value) : JSON.stringify(String(value));
}

/**
 * Write DB-owned state into each story's frontmatter, then make ONE commit.
 *
 * Only touches files whose rendered values actually differ, so a quiet hour
 * produces no commit at all rather than an empty-diff churn commit.
 */
export async function exportState(
  opts: { tasksDir?: string; commit?: boolean } = {},
): Promise<ExportResult> {
  const tasksDir = opts.tasksDir ?? resolveTasksDir();
  const doCommit = opts.commit ?? true;
  const changed: string[] = [];

  const stories = await Story.all().toArray();
  for (const s of stories) {
    if (!s.file_path) continue;
    const abs = join(tasksDir, s.file_path);
    if (!existsSync(abs)) continue;

    const desired: Record<string, string> = {
      status: render("status", s.status),
      pr: render("pr", s.pr),
      claim: render("claim", s.claim_at),
      assignee: render("assignee", s.assignee),
      "blocked-by": render("blocked-by", s.blocked_by),
      "closed-reason": render("closed-reason", s.closed_reason),
      updated: render("updated", s.updated_on),
    };

    const text = readFileSync(abs, "utf8");
    const fm = text.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? "";

    // Only write a key that is ALREADY PRESENT, or whose new value is
    // non-null. Optional keys are omitted from these files rather than set to
    // null — 1,694 of 7,164 stories have no `closed-reason:` line at all — so
    // writing every field unconditionally adds a null key to each of them and
    // turns the first export into a 1,694-file diff that buries the handful of
    // real state changes.
    const writes: Record<string, string> = {};
    for (const [k, v] of Object.entries(desired)) {
      const line = fm.match(new RegExp(`^${k}:\\s*(.*)$`, "m"));
      const present = line !== null;
      if (!present && v === "null") continue;
      if (present && line[1].trim() === v) continue;
      writes[k] = v;
    }
    if (Object.keys(writes).length === 0) continue;

    editFrontmatter(abs, writes);
    changed.push(s.file_path);
  }

  if (changed.length === 0 || !doCommit) {
    return { changed, committed: false, sha: null };
  }

  const git = (args: string[]): string =>
    execFileSync("git", args, { cwd: tasksDir, encoding: "utf8" }).trim();

  // Stage exactly the files we rewrote — never `git add -A`, which would sweep
  // up an agent's in-flight edits sitting in the same worktree.
  for (let i = 0; i < changed.length; i += 200) {
    git(["add", "--", ...changed.slice(i, i + 200)]);
  }
  // Nothing staged (someone reverted underneath us) → not an error.
  if (!git(["diff", "--cached", "--name-only"])) {
    return { changed, committed: false, sha: null };
  }
  git([
    "commit",
    "-q",
    "-m",
    `state: sync ${changed.length} stor${changed.length === 1 ? "y" : "ies"}`,
  ]);
  return { changed, committed: true, sha: git(["rev-parse", "HEAD"]) };
}
