/**
 * One-shot migration: markdown tree + old git log → SQLite.
 *
 * Two phases, deliberately separate:
 *
 *   1. CURRENT STATE from the markdown tree, via the ported `loadAll()`. This
 *      is the same reader build-index.mjs uses, so what lands in the DB is what
 *      index.json already says — which is what makes the equivalence gate a
 *      real check rather than a tautology of my own parsing.
 *
 *   2. HISTORY from the old repo's ~27k commit subjects, backfilled into
 *      `events`. Every tasks-CLI mutation was one commit titled
 *      "<verb>: <story-id> #<pr>", so the log IS the event stream the velocity
 *      and burndown charts reconstruct today. Moving it into a table is what
 *      lets those charts stop parsing git log — and is why archiving the old
 *      repo doesn't lose the history.
 *
 * Idempotent: truncates and reloads. Safe to re-run while iterating.
 */
import { execFileSync } from "node:child_process";
import { Base } from "@blazetrails/activerecord";
import config from "../config/database.js";
import { migrate } from "../src/migrator.js";
import {
  Event,
  Meta,
  Rfc,
  Story,
  StoryDep,
  StoryPackage,
  StoryPath,
  StoryRfcDep,
} from "../src/models/index.js";
// @ts-expect-error — ported JS module, no type declarations
import { extractStoryPaths, loadAll } from "./lib.mjs";

const ENV = (process.env.TRAILS_ENV ?? "development") as keyof typeof config;
const OLD_REPO = process.env.OLD_TASKS_DIR ?? `${process.env.HOME}/github/blazetrailsdev/tasks`;

interface LoadedRfc {
  dir: string;
  file: string;
  body: string;
  frontmatter: Record<string, unknown>;
}
interface LoadedStory {
  id: string;
  rfc: string;
  file: string;
  body: string;
  frontmatter: Record<string, unknown>;
}

/** js-yaml turns unquoted `updated: 2026-07-04` into a Date; store date-only. */
function dateOnly(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v);
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : s;
}

function str(v: unknown): string | null {
  return v == null ? null : String(v);
}

function int(v: unknown): number | null {
  return Number.isInteger(v) ? (v as number) : null;
}

function relPathOf(abs: string): string {
  const root = `${process.cwd()}/`;
  return abs.startsWith(root) ? abs.slice(root.length) : abs;
}

async function truncate(): Promise<void> {
  const conn = Base.connection;
  for (const t of [
    "story_deps",
    "story_rfc_deps",
    "story_paths",
    "story_packages",
    "events",
    "stories",
    "rfcs",
  ]) {
    await conn.execute(`DELETE FROM ${t}`);
  }
}

// insertAll is a raw multi-row INSERT — it runs no callbacks, so Rails' (and
// trails') automatic timestamps never fire and the NOT NULL created_at/updated_at
// blow up. Same as Rails' insert_all; supply them explicitly.
const NOW = new Date().toISOString();
const stamped = (rows: Record<string, unknown>[]): Record<string, unknown>[] =>
  rows.map((r) => ({ created_at: NOW, updated_at: NOW, ...r }));

// SQLite caps variables per statement; 500-row chunks stay well under it.
const CHUNK = 500;
async function insertChunked(
  model: { insertAll: (rows: Record<string, unknown>[]) => Promise<unknown> },
  rows: Record<string, unknown>[],
): Promise<void> {
  for (let i = 0; i < rows.length; i += CHUNK) {
    await model.insertAll(rows.slice(i, i + CHUNK));
  }
}

async function importState(): Promise<{ rfcs: number; stories: number; joins: number }> {
  const { rfcs, stories } = loadAll() as { rfcs: LoadedRfc[]; stories: LoadedStory[] };

  await insertChunked(
    Rfc as never,
    stamped(
      rfcs.map((r) => {
        const fm = r.frontmatter ?? {};
        return {
          id: r.dir,
          title: str(fm.title),
          status: str(fm.status) ?? "draft",
          owner: str(fm.owner),
          priority: int(fm.priority),
          superseded_by: str(fm["superseded-by"]),
          created_on: dateOnly(fm.created),
          updated_on: dateOnly(fm.updated),
          packages: JSON.stringify(fm.packages ?? []),
          clusters: JSON.stringify(fm.clusters ?? []),
          related_rfcs: JSON.stringify(fm["related-rfcs"] ?? []),
          file_path: relPathOf(r.file),
        };
      }),
    ),
  );

  // `status` here is the AUTHORED frontmatter status, not the effective one.
  // build-index.mjs downgrades `ready` to `draft` when the parent RFC isn't
  // active; that override is a presentation concern re-applied by the
  // read-model. Storing the raw value keeps the DB the source of authored truth
  // and keeps the override in exactly one place.
  await insertChunked(
    Story as never,
    stamped(
      stories.map((s) => {
        const fm = s.frontmatter ?? {};
        return {
          id: s.id,
          rfc_id: s.rfc,
          title: str(fm.title),
          status: str(fm.status) ?? "draft",
          cluster: str(fm.cluster),
          priority: int(fm.priority),
          est_loc: int(fm["est-loc"]),
          pr: int(fm.pr),
          claim_at: str(fm.claim),
          assignee: str(fm.assignee),
          blocked_by: str(fm["blocked-by"]),
          closed_reason: str(fm["closed-reason"]),
          updated_on: dateOnly(fm.updated),
          file_path: relPathOf(s.file),
        };
      }),
    ),
  );

  const deps: Record<string, unknown>[] = [];
  const rfcDeps: Record<string, unknown>[] = [];
  const paths: Record<string, unknown>[] = [];
  const packages: Record<string, unknown>[] = [];
  for (const s of stories) {
    const fm = s.frontmatter ?? {};
    for (const d of (fm.deps as string[]) ?? []) deps.push({ story_id: s.id, depends_on_id: d });
    for (const d of (fm["deps-rfc"] as string[]) ?? []) rfcDeps.push({ story_id: s.id, rfc_id: d });
    for (const p of (fm.packages as string[]) ?? []) packages.push({ story_id: s.id, package: p });
    for (const p of extractStoryPaths(s.body) as string[]) paths.push({ story_id: s.id, path: p });
  }
  await insertChunked(StoryDep as never, deps);
  await insertChunked(StoryRfcDep as never, rfcDeps);
  await insertChunked(StoryPath as never, paths);
  await insertChunked(StoryPackage as never, packages);

  return {
    rfcs: rfcs.length,
    stories: stories.length,
    joins: deps.length + rfcDeps.length + paths.length + packages.length,
  };
}

/**
 * Verbs the old CLI committed under. Anything else on main (chore/style/docs/
 * fix/feat, `auto-finalize`, merges) is repo maintenance, not a story event.
 *
 * `status` and `priority` carry an ARGUMENT in the prefix — "status ready:",
 * "priority 7:", "priority (clear):" — which is why a naive
 * /^(verb):/ pattern silently drops ~2,400 status flips and ~800 priority sets.
 */
const EVENT_VERBS = new Set([
  "new",
  "new-rfc",
  "claim",
  "done",
  "in-progress",
  "block",
  "close",
  "release",
  "reopen",
  "refine",
  "edit",
  "set-deps",
  "set-deps-rfc",
  "set-packages",
  "status",
  "priority",
  "finalize",
]);

interface ParsedSubject {
  verb: string;
  arg: string | null;
  target: string;
  pr: number | null;
  note: string | null;
}

/**
 * Parse one commit subject into an event.
 *
 * Deliberately NOT one regex. Real subjects look like:
 *   "done: converge-attribute-set-builder-residue #7028"
 *   "status ready: mysql-quote-string-must-escape-via-raw-connection"
 *   "priority (clear): single-to-sql-and-binds-compile-path"
 *   "edit: 0096/converge-column-subclass-state title and est-loc"
 *   "close: insert-builder-first-column — Delivered on origin/main. (1) ..."
 *
 * The trailing em-dash notes on close/block are multi-sentence prose that
 * happens to contain "#1234" and ":" — so the pr and target must be taken from
 * the head of the subject, never by scanning the whole line.
 */
function parseSubject(subject: string): ParsedSubject | null {
  const colon = subject.indexOf(": ");
  if (colon === -1) return null;

  const prefix = subject.slice(0, colon).trim();
  const rest = subject.slice(colon + 2).trim();
  const [verb, ...argWords] = prefix.split(/\s+/);

  // RFC-level mutations invert the shape: the TARGET is in the prefix and the
  // verb is in the rest — "rfc 0124-arel-surfaced-deviations: status active",
  // "rfc 0077-quoting-binds-fidelity: priority 3". Handle before the generic
  // path, which would otherwise read the target as the literal word "status".
  if (verb === "rfc" && argWords.length === 1) {
    return { verb: "rfc", arg: rest, target: argWords[0], pr: null, note: null };
  }

  if (!EVENT_VERBS.has(verb)) return null;

  // Everything up to the em-dash (or the whole rest) is the target clause; the
  // note beyond it is free prose and must not be mined for target/pr.
  const dash = rest.indexOf(" — ");
  const head = dash === -1 ? rest : rest.slice(0, dash);
  const note = dash === -1 ? null : rest.slice(dash + 3).trim();

  const target = head.split(/\s+/)[0];
  if (!target) return null;

  const prMatch = /(?:^|\s)#(\d+)(?:\s|$)/.exec(head);
  return {
    verb,
    arg: argWords.length ? argWords.join(" ") : null,
    target,
    pr: prMatch ? Number(prMatch[1]) : null,
    note,
  };
}

// Field separator for `git log --pretty`. Unit Separator can't occur in a commit
// subject, author name, or ISO date, so splitting on it is unambiguous — unlike
// a tab or pipe, which subjects do contain.
const SEP = "\u001f";

async function importHistory(): Promise<{
  events: number;
  scanned: number;
  skipped: [string, number][];
}> {
  const log = execFileSync(
    "git",
    ["log", "--reverse", "--date=iso-strict", `--pretty=format:%cd${SEP}%an${SEP}%s`],
    { cwd: OLD_REPO, encoding: "utf8", maxBuffer: 512 * 1024 * 1024 },
  );

  const lines = log.split("\n");
  const rows: Record<string, unknown>[] = [];
  const skipped = new Map<string, number>();

  for (const line of lines) {
    const [at, actor, subject] = line.split(SEP);
    if (!subject) continue;
    const parsed = parseSubject(subject.trim());
    if (!parsed) {
      // Track what we're dropping by leading token, so "we only kept the
      // events" is an auditable claim rather than an assumption.
      const head = subject.trim().split(/[\s:(]/)[0] || "(blank)";
      skipped.set(head, (skipped.get(head) ?? 0) + 1);
      continue;
    }
    const { verb, arg, target, pr, note } = parsed;

    // `new:` and `edit:` record a path-ish "<rfc>/<id>" or "<rfc>/stories/<id>";
    // the other story verbs record a bare id. `new-rfc:`/`finalize:` name an RFC.
    const isRfcVerb = verb === "new-rfc" || verb === "finalize" || verb === "rfc";
    const storyId = isRfcVerb ? null : target.includes("/") ? target.split("/").pop()! : target;
    const rfcId = isRfcVerb ? target : target.includes("/") ? target.split("/")[0] : null;

    rows.push({
      at,
      verb,
      story_id: storyId,
      rfc_id: rfcId,
      pr,
      actor,
      // `arg` is the status value / priority number; `note` is the close/block
      // rationale. Both matter — the close reason is the only record of WHY a
      // story was abandoned, and it is not in the story file after deletion.
      detail: arg || note ? JSON.stringify({ arg, note }) : null,
    });
  }

  await insertChunked(Event as never, rows);
  const topSkipped = [...skipped.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  return { events: rows.length, scanned: lines.length, skipped: topSkipped };
}

async function main(): Promise<void> {
  await Base.establishConnection(config[ENV]);
  await migrate();
  await truncate();

  const t0 = Date.now();
  // One transaction for the whole load: a crash mid-import must not leave a
  // half-populated DB behind, since truncate() has already run. (It is not a
  // speed win — measured identical — the cost is per-insertAll overhead in the
  // ORM, not per-statement fsync.)
  //
  // Base.transaction's return type is `T | undefined` because a rolled-back
  // block yields nothing; here a rollback throws, so the value is present.
  const { rfcs, stories, joins } = (await Base.transaction(async () => importState()))!;
  console.log(
    `imported ${rfcs} RFCs, ${stories} stories, ${joins} join rows (${Date.now() - t0}ms)`,
  );

  const t1 = Date.now();
  const { events, scanned, skipped } = (await Base.transaction(async () => importHistory()))!;
  console.log(
    `backfilled ${events} events from ${scanned} commits in ${OLD_REPO} (${Date.now() - t1}ms)`,
  );
  console.log(
    `  skipped ${scanned - events} non-event commits; top: ` +
      skipped.map(([k, n]) => `${k}=${n}`).join(" "),
  );

  const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  await Meta.set("last_ingested_sha", head);
  console.log(`watermark last_ingested_sha=${head.slice(0, 9)}`);
}

await main();
process.exit(0);
