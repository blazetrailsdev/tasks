/**
 * Ingest: git → DB, for markdown-owned fields only.
 *
 * The field ownership split is what keeps this from being bidirectional sync:
 *
 *   markdown owns  title, rfc, cluster, deps, deps-rfc, est-loc, priority,
 *                  packages, body prose        (written by agents via PR)
 *   DB owns        status, pr, claim, assignee, blocked-by, closed-reason,
 *                  updated                     (written by the mutation verbs)
 *
 * The sets are DISJOINT, so ingest and export are two independent one-way
 * projections and cannot conflict. Every rule below exists to preserve that.
 *
 * Ingest is also the SOLE creator and deleter of story rows. A new story file
 * becomes a row; a deleted file (the documented way to abandon a story) removes
 * one. Both emit events.
 *
 * Frontmatter `status` is honored ON INSERT ONLY, as a birth seed
 * (`status: draft` / `ready`), and ignored forever after. "Seed value, not a
 * sync value" — otherwise a stale file would clobber a live claim.
 *
 * Incremental: a `last_ingested_sha` watermark in `meta` bounds the work to
 * `git diff <sha>..HEAD`, so this is cheap enough to run from the merge webhook.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Base } from "@blazetrails/activerecord";
import { VerbExit } from "./db.js";
import { parse as parseYaml } from "yaml";
import {
  Event,
  Meta,
  Rfc,
  Story,
  StoryDep,
  StoryPackage,
  StoryPath,
  StoryRfcDep,
} from "./models/index.js";
import { currentBranch, headSha, mainWorktree } from "./db-path.js";
// @ts-expect-error — ported JS module, no type declarations
import { extractStoryPaths, RFC_DIR_RE } from "../scripts/lib.mjs";

export const MARKDOWN_OWNED = [
  "title",
  "rfc",
  "cluster",
  "deps",
  "deps-rfc",
  "est-loc",
  "priority",
  "packages",
] as const;

/**
 * Fields ingest must NEVER write and CI must never let a PR change. Kept here
 * next to the ingest rules so the guard and the reconciler cannot drift.
 */
export const DB_OWNED = [
  "status",
  "pr",
  "claim",
  "assignee",
  "blocked-by",
  "closed-reason",
  "updated",
] as const;

export interface IngestResult {
  from: string | null;
  to: string;
  created: number;
  updated: number;
  closed: number;
  rfcsTouched: number;
  scanned: number;
}

interface Parsed {
  frontmatter: Record<string, unknown>;
  body: string;
}

function parseFile(path: string): Parsed | null {
  const text = readFileSync(path, "utf8");
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return null;
  return { frontmatter: (parseYaml(m[1]) ?? {}) as Record<string, unknown>, body: m[2] };
}

function str(v: unknown): string | null {
  return v == null ? null : String(v);
}
function int(v: unknown): number | null {
  return Number.isInteger(v) ? (v as number) : null;
}

/**
 * Shares lib.mjs's RFC_DIR_RE rather than restating it: the exclusion list is
 * exactly the kind of rule that drifts when copied.
 */
function isRealRfcDir(dir: string): boolean {
  return (RFC_DIR_RE as RegExp).test(dir);
}

/** Story files live at rfcs/<rfc>/stories/<id>.md. */
const STORY_PATH = /^rfcs\/([^/]+)\/stories\/([^/]+)\.md$/;
const RFC_PATH = /^rfcs\/([^/]+)\/README\.md$/;

/**
 * Bring the main checkout in line with origin/main before reading it.
 *
 * Two things pull local and origin apart constantly: `tasks export` commits
 * state locally, and agents push story files straight to origin/main. Without
 * this, ingest reads a stale local HEAD and a story pushed by an agent is
 * invisible until someone happens to pull — which is exactly how a findings
 * story sat on origin with no row tonight.
 *
 * --rebase --autostash because local export commits are unpushed, so the two
 * sides genuinely diverge rather than fast-forward.
 */
function syncMain(tasksDir: string): void {
  try {
    execFileSync("git", ["fetch", "--quiet", "origin", "main"], { cwd: tasksDir });
    execFileSync("git", ["pull", "--rebase", "--autostash", "--quiet", "origin", "main"], {
      cwd: tasksDir,
    });
  } catch (e) {
    // Non-fatal: ingest what we have rather than skipping the run entirely.
    console.error(`warning: could not sync main before ingest: ${(e as Error).message}`);
  }
}

/** Is `sha` still reachable from HEAD? A rebase or force-push orphans it. */
function isAncestor(tasksDir: string, sha: string): boolean {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", sha, "HEAD"], { cwd: tasksDir });
    return true;
  } catch {
    return false;
  }
}

function changedPaths(tasksDir: string, from: string | null, to: string): string[] {
  const args = from
    ? ["diff", "--name-only", `${from}..${to}`, "--", "rfcs/"]
    : ["ls-tree", "-r", "--name-only", to, "--", "rfcs/"];
  const out = execFileSync("git", args, {
    cwd: tasksDir,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return out.split("\n").filter(Boolean);
}

/**
 * Work around a trails bug: once a model's types are loaded (any findBy on it),
 * writing a string that STARTS WITH ':' silently drops that one colon —
 * `::DateTime` stores as `:DateTime`, `:Alpha` as `Alpha`. Mid-string colons are
 * fine. It reads like symbol-style coercion in the string caster.
 *
 * It corrupted 8 story titles here, and a re-scan re-corrupted them every time,
 * which is what made this look like "the update silently does not apply".
 *
 * Raw SQL bypasses the caster. Narrow on purpose — only values that start with
 * a colon, only after the ORM has already written. Remove this once the trails
 * story lands; the test in verbs.test.ts will fail loudly if it is removed too
 * early.
 */
async function fixLeadingColon(storyId: string, title: string | null): Promise<void> {
  if (!title || !title.startsWith(":")) return;
  await Base.connection.execute(
    `UPDATE stories SET title = ${sqlQuote(title)} WHERE id = ${sqlQuote(storyId)}`,
  );
}

/** Single-quote a SQL string literal, doubling embedded quotes. */
function sqlQuote(v: string): string {
  return `'${v.replace(/'/g, "''")}'`;
}

async function replaceJoins(
  storyId: string,
  fm: Record<string, unknown>,
  body: string,
): Promise<void> {
  await StoryDep.where({ story_id: storyId }).deleteAll();
  await StoryRfcDep.where({ story_id: storyId }).deleteAll();
  await StoryPackage.where({ story_id: storyId }).deleteAll();
  await StoryPath.where({ story_id: storyId }).deleteAll();

  for (const d of (fm.deps as string[]) ?? []) {
    await StoryDep.create({ story_id: storyId, depends_on_id: d });
  }
  for (const d of (fm["deps-rfc"] as string[]) ?? []) {
    await StoryRfcDep.create({ story_id: storyId, rfc_id: d });
  }
  for (const p of (fm.packages as string[]) ?? []) {
    await StoryPackage.create({ story_id: storyId, package: p });
  }
  for (const p of extractStoryPaths(body) as string[]) {
    await StoryPath.create({ story_id: storyId, path: p });
  }
}

export async function ingest(opts: { tasksDir?: string; to?: string } = {}): Promise<IngestResult> {
  // ALWAYS the main working tree, never the caller's cwd. The database is
  // global (one per clone, via gitCommonDir) so it can only mirror one branch,
  // and that branch is main. Ingesting from a feature-branch worktree publishes
  // unmerged stories to every agent on the host — see mainWorktree().
  const tasksDir = opts.tasksDir ?? mainWorktree();
  if (!opts.to) syncMain(tasksDir);
  const to = opts.to ?? headSha(tasksDir);

  // A stored watermark that is no longer an ancestor of HEAD was rewritten out
  // of history — by a rebase, an autostash pull, or a force-push. Diffing from
  // it silently yields the wrong set and SKIPS real changes: that is how two
  // recovered stories went missing tonight, with ingest cheerfully reporting
  // "0 created". Treat an unreachable watermark as no watermark and re-scan.
  let from = await Meta.get("last_ingested_sha");
  if (from && !isAncestor(tasksDir, from)) {
    console.error(
      `warning: watermark ${from.slice(0, 9)} is no longer in history (rebase or force-push) — full re-scan`,
    );
    from = null;
  }

  const result: IngestResult = {
    from,
    to,
    created: 0,
    updated: 0,
    closed: 0,
    rfcsTouched: 0,
    scanned: 0,
  };

  if (from === to) return result;

  // Refuse rather than mirror a branch. A detached or non-main main-worktree is
  // a transient state (a bisect, a rebase); ingesting it would write branch
  // content the next ingest cannot tell apart from merged content.
  const branch = currentBranch(tasksDir);
  if (branch !== "main") {
    console.error(
      `error: ${tasksDir} is on ${branch ?? "a detached HEAD"}, not main — refusing to ingest.\n` +
        `  The database mirrors main. Ingesting another branch would publish unmerged\n` +
        `  stories to every agent sharing this checkout.`,
    );
    throw new VerbExit(1);
  }

  const paths = changedPaths(tasksDir, from, to);
  result.scanned = paths.length;

  // Chunked transactions, NOT one big one.
  //
  // A full re-scan touches 7,000+ stories. Wrapped in a single transaction it
  // holds SQLite's write lock for minutes, and busy_timeout is 10s — so every
  // other writer fails outright. That is not theoretical: a re-scan running in
  // the background made a live post-merge hook fail with "database is locked"
  // and very likely broke the worker's own `tasks done` at the same time.
  //
  // Chunking keeps each lock hold to well under the busy_timeout, so concurrent
  // claims and closes just wait their turn. The cost is that a crashed re-scan
  // leaves partial progress — which is fine, because the watermark is only
  // advanced at the end, so the next run redoes it.
  const CHUNK = 200;
  for (let i = 0; i < paths.length; i += CHUNK) {
    await ingestChunk(paths.slice(i, i + CHUNK), tasksDir, result);
  }
  await Meta.set("last_ingested_sha", to);

  return result;
}

async function ingestChunk(paths: string[], tasksDir: string, result: IngestResult): Promise<void> {
  await Base.transaction(async () => {
    for (const rel of paths) {
      const rfcMatch = RFC_PATH.exec(rel);
      if (rfcMatch && isRealRfcDir(rfcMatch[1])) {
        await ingestRfc(tasksDir, rel, rfcMatch[1]);
        result.rfcsTouched++;
        continue;
      }
      const storyMatch = STORY_PATH.exec(rel);
      if (!storyMatch) continue;
      const [, rfcId, storyId] = storyMatch;
      // Apply build-index.mjs's own directory filter, which excludes
      // `0000-template/` — the literal copy-this starter, not a real RFC.
      // Without it ingest creates a phantom `template-story` row that no
      // markdown-derived index contains, and the two silently drift.
      if (!isRealRfcDir(rfcId)) continue;
      const abs = join(tasksDir, rel);

      if (!existsSync(abs)) {
        // A vanished file CLOSES the story; it never deletes the row.
        //
        // The row carries the history — every claim, every PR, and the
        // closed_reason that is the only record of WHY work was abandoned.
        // Deleting it throws all of that away and leaves an `events` trail
        // pointing at a story that no longer exists. Closing keeps the record
        // and still takes it out of the ready queue, which is the only thing
        // deletion was achieving.
        //
        // Prefer `tasks close <id> <reason>`: it captures a real reason instead
        // of the generic one synthesized here.
        const existing = await Story.findBy({ id: storyId });
        if (existing && existing.status !== "closed") {
          await Story.where({ id: storyId }).updateAll({
            status: "closed",
            closed_reason:
              existing.closed_reason ??
              `Story file removed from the repo (${rel}). Closed by ingest; no reason was recorded — use \`tasks close\` to state one.`,
            updated_on: new Date().toISOString().slice(0, 10),
          });
          await Event.create({
            at: new Date().toISOString(),
            verb: "close",
            story_id: storyId,
            rfc_id: rfcId,
            detail: JSON.stringify({ note: "story file removed from the repo" }),
          });
          result.closed++;
        }
        continue;
      }

      const parsed = parseFile(abs);
      if (!parsed) continue;
      const { frontmatter: fm, body } = parsed;

      const markdownFields = {
        rfc_id: rfcId,
        title: str(fm.title),
        cluster: str(fm.cluster),
        priority: int(fm.priority),
        est_loc: int(fm["est-loc"]),
        file_path: rel,
      };

      const existing = await Story.findBy({ id: storyId });
      if (existing) {
        // DB-owned columns are deliberately absent from this update. A PR that
        // hand-edits `status:` changes nothing here — which is why CI rejects
        // such a PR outright rather than letting it look like it worked.
        await Story.where({ id: storyId }).updateAll(markdownFields);
        await fixLeadingColon(storyId, markdownFields.title);
        result.updated++;
      } else {
        await Story.create({
          id: storyId,
          ...markdownFields,
          // Seed-on-insert only.
          status: str(fm.status) ?? "draft",
          pr: int(fm.pr),
          assignee: str(fm.assignee),
          claim_at: str(fm.claim),
          blocked_by: str(fm["blocked-by"]),
          closed_reason: str(fm["closed-reason"]),
          updated_on: new Date().toISOString().slice(0, 10),
        });
        await Event.create({
          at: new Date().toISOString(),
          verb: "new",
          story_id: storyId,
          rfc_id: rfcId,
        });
        result.created++;
      }
      await replaceJoins(storyId, fm, body);
    }
  });
}

async function ingestRfc(tasksDir: string, rel: string, rfcId: string): Promise<void> {
  const abs = join(tasksDir, rel);
  if (!existsSync(abs)) return;
  const parsed = parseFile(abs);
  if (!parsed) return;
  const fm = parsed.frontmatter;

  const fields = {
    title: str(fm.title),
    owner: str(fm.owner),
    priority: int(fm.priority),
    superseded_by: str(fm["superseded-by"]),
    packages: JSON.stringify(fm.packages ?? []),
    clusters: JSON.stringify(fm.clusters ?? []),
    related_rfcs: JSON.stringify(fm["related-rfcs"] ?? []),
    file_path: rel,
  };

  const existing = await Rfc.findBy({ id: rfcId });
  if (existing) {
    // An RFC's `status:` IS markdown-owned — unlike a story's. RFC status moves
    // through PR review (draft → active → closed), not through a CLI verb, so
    // the file is its source of truth and ingest must carry it across.
    await Rfc.where({ id: rfcId }).updateAll({ ...fields, status: str(fm.status) ?? "draft" });
  } else {
    await Rfc.create({
      id: rfcId,
      ...fields,
      status: str(fm.status) ?? "draft",
      created_on: str(fm.created)?.slice(0, 10) ?? null,
      updated_on: str(fm.updated)?.slice(0, 10) ?? null,
    });
  }
}
