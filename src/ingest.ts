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
import { parse as parseYaml } from "yaml";
import { Event, Meta, Rfc, Story, StoryDep, StoryPackage, StoryPath, StoryRfcDep } from "./models/index.js";
import { headSha, resolveTasksDir } from "./db-path.js";
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
  deleted: number;
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

function changedPaths(tasksDir: string, from: string | null, to: string): string[] {
  const args = from
    ? ["diff", "--name-only", `${from}..${to}`, "--", "rfcs/"]
    : ["ls-tree", "-r", "--name-only", to, "--", "rfcs/"];
  const out = execFileSync("git", args, { cwd: tasksDir, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return out.split("\n").filter(Boolean);
}

async function replaceJoins(storyId: string, fm: Record<string, unknown>, body: string): Promise<void> {
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
  const tasksDir = opts.tasksDir ?? resolveTasksDir();
  const to = opts.to ?? headSha(tasksDir);
  const from = await Meta.get("last_ingested_sha");

  const result: IngestResult = {
    from,
    to,
    created: 0,
    updated: 0,
    deleted: 0,
    rfcsTouched: 0,
    scanned: 0,
  };

  if (from === to) return result;

  const paths = changedPaths(tasksDir, from, to);
  result.scanned = paths.length;

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
        // Deleting a story file is the documented way to abandon a story.
        const existing = await Story.findBy({ id: storyId });
        if (existing) {
          await StoryDep.where({ story_id: storyId }).deleteAll();
          await StoryRfcDep.where({ story_id: storyId }).deleteAll();
          await StoryPackage.where({ story_id: storyId }).deleteAll();
          await StoryPath.where({ story_id: storyId }).deleteAll();
          await Story.where({ id: storyId }).deleteAll();
          await Event.create({ at: new Date().toISOString(), verb: "delete", story_id: storyId, rfc_id: rfcId });
          result.deleted++;
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
        await Event.create({ at: new Date().toISOString(), verb: "new", story_id: storyId, rfc_id: rfcId });
        result.created++;
      }
      await replaceJoins(storyId, fm, body);
    }

    await Meta.set("last_ingested_sha", to);
  });

  return result;
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
