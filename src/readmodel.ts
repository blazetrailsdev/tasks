/**
 * Read-models: `index.json` and `events.json`, generated from the DB.
 *
 * `index.json` keeps the EXACT shape build-index.mjs emitted. That is a
 * deliberate blast-radius control: btwhooks' Go side reads this file directly
 * (spawnloop.go:1042 `loadIndex`, rfccharts.go:244), so keeping the shape
 * byte-identical means the cutover needs no Go change and the equivalence gate
 * can diff old against new.
 *
 * `events.json` is new. It replaces walking 27k commit subjects in velocity.go
 * and rfccharts.go with a table that was built to answer exactly that question.
 */
import { Base } from "@blazetrails/activerecord";
import { Event, Rfc, Story } from "./models/index.js";
// @ts-expect-error — ported JS module, no type declarations
import { effectiveStoryStatus } from "../scripts/validate-lib.mjs";

/** Frontmatter dates were parsed by js-yaml into Dates, so index.json carries
 * ISO midnight. Reproduce that exactly from the stored date-only string.
 *
 * Tolerates a value that carries a time component instead of being date-only.
 * It should never be one — the models pin the timestamp touch off these
 * columns (models/timestamps.ts) — but when it was, `new Date("<instant>T00:0
 * 0:00.000Z")` threw RangeError, and because buildIndex runs on every read and
 * after every mutation, ONE bad row took every verb down for everyone on the
 * host with the bare message "error: Invalid time value". That blast radius is
 * not worth defending a data-quality assertion: take the date part, and if it
 * still will not parse, drop the field rather than the whole index. */
function isoMidnight(d: string | null): string | null {
  if (!d) return null;
  const day = d.slice(0, 10);
  const at = new Date(`${day}T00:00:00.000Z`);
  return Number.isNaN(at.getTime()) ? null : at.toISOString();
}

function parseJsonArray(v: string | null): string[] {
  if (!v) return [];
  try {
    const parsed: unknown = JSON.parse(v);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

const PRIORITY_UNSET = 1_000_000;

export interface IndexJson {
  rfcs: Record<string, unknown>[];
  stories: Record<string, unknown>[];
}

/**
 * Rebuild index.json's contents from the DB.
 *
 * Ordering is load-bearing, not cosmetic: build-index.mjs sorts RFCs by dir and
 * stories by (priority, id), and the spawn loop consumes index.json in that
 * order — the sort IS part of the ready-queue ranking. Reproduce it exactly.
 */
export async function buildIndex(): Promise<IndexJson> {
  const conn = Base.connection;

  // One query per table rather than per-row association loads: this runs after
  // every mutation, so an N+1 over 7k stories would put seconds into the hot
  // path. Join rows are grouped in JS.
  const [rfcRows, storyRows, depRows, rfcDepRows, pathRows, pkgRows] = await Promise.all([
    conn.selectAll("SELECT * FROM rfcs ORDER BY id"),
    conn.selectAll("SELECT * FROM stories"),
    conn.selectAll("SELECT story_id, depends_on_id FROM story_deps ORDER BY rowid"),
    conn.selectAll("SELECT story_id, rfc_id FROM story_rfc_deps ORDER BY rowid"),
    conn.selectAll("SELECT story_id, path FROM story_paths ORDER BY rowid"),
    conn.selectAll("SELECT story_id, package FROM story_packages ORDER BY rowid"),
  ]);

  const group = (rows: Record<string, unknown>[], key: string): Map<string, string[]> => {
    const m = new Map<string, string[]>();
    for (const r of rows) {
      const id = String(r.story_id);
      const list = m.get(id);
      if (list) list.push(String(r[key]));
      else m.set(id, [String(r[key])]);
    }
    return m;
  };

  const depsBy = group(depRows.toArray(), "depends_on_id");
  const rfcDepsBy = group(rfcDepRows.toArray(), "rfc_id");
  const pathsBy = group(pathRows.toArray(), "path");
  const pkgsBy = group(pkgRows.toArray(), "package");

  const rfcs = rfcRows.toArray();
  const rfcStatusById = new Map(rfcs.map((r) => [String(r.id), (r.status as string) ?? null]));

  const stories = storyRows.toArray();
  const prio = (s: Record<string, unknown>): number =>
    Number.isInteger(s.priority) ? (s.priority as number) : PRIORITY_UNSET;
  stories.sort((a, b) => prio(a) - prio(b) || String(a.id).localeCompare(String(b.id)));

  return {
    rfcs: rfcs.map((r) => ({
      id: r.id,
      title: r.title ?? null,
      status: r.status ?? null,
      priority: Number.isInteger(r.priority) ? r.priority : null,
      owner: r.owner ?? null,
      created: isoMidnight(r.created_on as string | null),
      updated: isoMidnight(r.updated_on as string | null),
      packages: parseJsonArray(r.packages as string | null),
      clusters: parseJsonArray(r.clusters as string | null),
      superseded_by: r.superseded_by ?? null,
      related_rfcs: parseJsonArray(r.related_rfcs as string | null),
      file_path: r.file_path,
    })),
    stories: stories.map((s) => {
      const id = String(s.id);
      return {
        id: s.id,
        rfc: s.rfc_id,
        title: s.title ?? null,
        // The parent-RFC override lives here and only here: the DB stores the
        // AUTHORED status, and a `ready` story under a non-active RFC is
        // downgraded at emit time so no consumer can present it as claimable.
        status: effectiveStoryStatus(rfcStatusById.get(String(s.rfc_id)) ?? null, s.status ?? null),
        raw_status: s.status ?? null,
        cluster: s.cluster ?? null,
        packages: pkgsBy.get(id) ?? [],
        priority: Number.isInteger(s.priority) ? s.priority : null,
        updated: isoMidnight(s.updated_on as string | null),
        deps: depsBy.get(id) ?? [],
        deps_rfc: rfcDepsBy.get(id) ?? [],
        est_loc: s.est_loc ?? null,
        pr: s.pr ?? null,
        claim: s.claim_at ?? null,
        assignee: s.assignee ?? null,
        blocked_by: s.blocked_by ?? null,
        closed_reason: s.closed_reason ?? null,
        story_paths: pathsBy.get(id) ?? [],
        file_path: s.file_path,
      };
    }),
  };
}

export interface EventsJson {
  events: Record<string, unknown>[];
}

/**
 * The event stream velocity.go and rfccharts.go read instead of `git log`.
 * Chronological, which is the order both collectors walk.
 */
export async function buildEvents(): Promise<EventsJson> {
  const rows = await Base.connection.selectAll(
    "SELECT at, verb, story_id, rfc_id, pr, actor, detail FROM events ORDER BY at, id",
  );
  return {
    events: rows.toArray().map((e) => ({
      at: e.at,
      verb: e.verb,
      story: e.story_id ?? null,
      rfc: e.rfc_id ?? null,
      pr: e.pr ?? null,
      actor: e.actor ?? null,
      detail: e.detail ?? null,
    })),
  };
}

export async function countsFor(): Promise<{ rfcs: number; stories: number; events: number }> {
  // count() is `number | Map` because the grouped form returns per-group counts.
  const n = (v: number | Map<unknown, number>): number => (typeof v === "number" ? v : 0);
  return {
    rfcs: n(await Rfc.count()),
    stories: n(await Story.count()),
    events: n(await Event.count()),
  };
}
