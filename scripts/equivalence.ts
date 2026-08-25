/**
 * THE GATE. Do not cut over past a mismatch.
 *
 * Regenerates index.json from the DB and diffs it against the git-derived
 * index.json that build-index.mjs produces from the markdown tree. They must
 * match for every RFC and every story.
 *
 * Why this is the right check: btwhooks' Go side reads index.json directly
 * (spawnloop.go:1042, rfccharts.go:244) and the ready-queue ranking is a set of
 * pure functions over that exact structure. If the two indexes agree, then the
 * spawn loop, the backlog page, and every ranking function agree too — without
 * having to re-verify each one.
 *
 * Reports the first N differing fields rather than a boolean, because "which
 * field drifted" is the only useful output when it fails.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Base } from "@blazetrails/activerecord";
import config from "../config/database.js";
import { buildIndex } from "../src/readmodel.js";

const ENV = (process.env.TRAILS_ENV ?? "development") as keyof typeof config;
const MAX_REPORT = 15;

type Row = Record<string, unknown>;

function diffRow(a: Row, b: Row, keys: string[]): string[] {
  const out: string[] = [];
  for (const k of keys) {
    const av = JSON.stringify(a[k] ?? null);
    const bv = JSON.stringify(b[k] ?? null);
    if (av !== bv) out.push(`${k}: git=${trunc(av)} db=${trunc(bv)}`);
  }
  return out;
}

const trunc = (s: string): string => (s.length > 80 ? `${s.slice(0, 77)}...` : s);

function compare(
  label: string,
  gitRows: Row[],
  dbRows: Row[],
  keys: string[],
): { problems: string[]; ordered: boolean } {
  const problems: string[] = [];

  const gitIds = gitRows.map((r) => String(r.id));
  const dbIds = dbRows.map((r) => String(r.id));
  // Order is part of the contract: the spawn loop consumes index.json in order,
  // so a reordered index is a behavior change even if every row matches.
  const ordered = JSON.stringify(gitIds) === JSON.stringify(dbIds);
  if (!ordered) {
    const firstDiff = gitIds.findIndex((id, i) => id !== dbIds[i]);
    problems.push(
      `${label}: ORDER differs at position ${firstDiff} (git=${gitIds[firstDiff]} db=${dbIds[firstDiff]})`,
    );
  }

  const dbById = new Map(dbRows.map((r) => [String(r.id), r]));
  const gitById = new Map(gitRows.map((r) => [String(r.id), r]));
  for (const id of gitById.keys())
    if (!dbById.has(id)) problems.push(`${label}: missing in db: ${id}`);
  for (const id of dbById.keys())
    if (!gitById.has(id)) problems.push(`${label}: extra in db: ${id}`);

  let mismatched = 0;
  for (const [id, gitRow] of gitById) {
    const dbRow = dbById.get(id);
    if (!dbRow) continue;
    const fields = diffRow(gitRow, dbRow, keys);
    if (fields.length) {
      mismatched++;
      if (problems.length < MAX_REPORT)
        problems.push(`${label} ${id}\n    ${fields.join("\n    ")}`);
    }
  }
  if (mismatched) problems.push(`${label}: ${mismatched}/${gitById.size} rows differ`);
  return { problems, ordered };
}

async function main(): Promise<void> {
  // REBUILD the git-derived index first. Every mutation republishes index.json
  // FROM THE DATABASE (db.ts publishReadModels), so whatever sits on disk is
  // normally the DB's own output — reading it without rebuilding turns this
  // into a DB-vs-DB self-comparison that CANNOT FAIL. Ask build-index.mjs, the
  // markdown reader, for a fresh one every time.
  execFileSync("node", ["scripts/build-index.mjs"], { cwd: process.cwd(), stdio: "ignore" });

  const gitIndexPath = join(process.cwd(), "index.json");
  const gitIndex = JSON.parse(readFileSync(gitIndexPath, "utf8")) as {
    rfcs: Row[];
    stories: Row[];
  };

  await Base.establishConnection(config[ENV]);
  const t0 = Date.now();
  const dbIndex = await buildIndex();
  const ms = Date.now() - t0;

  const RFC_KEYS = [
    "id",
    "title",
    "status",
    "priority",
    "owner",
    "created",
    "updated",
    "packages",
    "clusters",
    "superseded_by",
    "related_rfcs",
    "file_path",
  ];
  const STORY_KEYS = [
    "id",
    "rfc",
    "title",
    "status",
    "raw_status",
    "cluster",
    "packages",
    "priority",
    "updated",
    "deps",
    "deps_rfc",
    "est_loc",
    "pr",
    "claim",
    "assignee",
    "blocked_by",
    "closed_reason",
    "story_paths",
    "file_path",
  ];

  const rfcResult = compare("rfc", gitIndex.rfcs, dbIndex.rfcs, RFC_KEYS);
  const storyResult = compare("story", gitIndex.stories, dbIndex.stories, STORY_KEYS);
  const problems = [...rfcResult.problems, ...storyResult.problems];

  console.log(`git index:  ${gitIndex.rfcs.length} rfcs, ${gitIndex.stories.length} stories`);
  console.log(`db  index:  ${dbIndex.rfcs.length} rfcs, ${dbIndex.stories.length} stories`);
  console.log(`generated from DB in ${ms}ms`);

  if (problems.length === 0) {
    console.log("\nGATE PASSED — db-derived index.json matches the git-derived one exactly.");
    process.exit(0);
  }
  console.log(`\nGATE FAILED — ${problems.length} problem(s):\n`);
  for (const p of problems.slice(0, MAX_REPORT)) console.log(`  ${p}`);
  if (problems.length > MAX_REPORT) console.log(`  ... and ${problems.length - MAX_REPORT} more`);
  process.exit(1);
}

await main();
