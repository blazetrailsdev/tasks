#!/usr/bin/env node
// Read-only reconcile report (RFC 0011, story reconcile-tooling).
//
// For every story in the numbered RFCs 0001–0010, gather shipped-signals and
// print a triage verdict — likely-done / likely-open / unknown — with the
// evidence behind it. This NEVER edits story frontmatter; it only reports.
// `reconcile-existing-rfcs` consumes the output and applies status flips.
//
// Signals:
//   1. `pr:` frontmatter set       → is that trails PR merged?
//   2. `#NNNN` refs in the body     → are those trails PRs merged?
//   3. trails merged-PR title match → distinctive token overlap (weak)
//   4. memory-index seed            → a memory line names the story as
//                                     done/shipped/resolved/no-op
//
// Usage:
//   node scripts/reconcile.mjs            # human table
//   node scripts/reconcile.mjs --json     # machine-readable
//
// Env:
//   TRAILS_REPO   default "blazetrailsdev/trails" (passed to `gh --repo`)
//   MEMORY_DIR    default the Claude project memory dir; skipped if absent.

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { loadAll } from "./lib.mjs";

const JSON_OUT = process.argv.includes("--json");
const TRAILS_REPO = process.env.TRAILS_REPO ?? "blazetrailsdev/trails";
const MEMORY_DIR =
  process.env.MEMORY_DIR ??
  join(process.env.HOME ?? "", ".claude/projects/-home-dean-github-blazetrailsdev-trails/memory");

const EXISTING_RFC_RE = /^00(0[1-9]|10)-/; // 0001–0010 only
const PR_REF_RE = /#(\d{2,5})\b/g;
const DONE_WORDS = /\b(shipped|done|resolved|no-?op|already|complete|closed|merged)\b/i;
const STOPWORDS = new Set(
  (
    "the a an and or of to for in on via vs with into from is are be add adds added " +
    "fix fixes fixed wire route remove drop test tests story rfc pr ar make support " +
    "via through per use using new"
  ).split(" "),
);

function sh(file, args) {
  try {
    return execFileSync(file, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return null;
  }
}

// ── Signal source: trails merged PRs ──────────────────────────────────────
function loadMergedPRs() {
  const out = sh("gh", [
    "pr",
    "list",
    "--repo",
    TRAILS_REPO,
    "--state",
    "merged",
    "--limit",
    "4000",
    "--json",
    "number,title",
  ]);
  if (!out) return { byNumber: new Map(), titles: [], available: false };
  let rows = [];
  try {
    rows = JSON.parse(out);
  } catch {
    return { byNumber: new Map(), titles: [], available: false };
  }
  const byNumber = new Map();
  const titles = [];
  for (const r of rows) {
    byNumber.set(String(r.number), r.title ?? "");
    titles.push({ number: r.number, tokens: tokenize(r.title ?? "") });
  }
  return { byNumber, titles, available: true };
}

// ── Signal source: memory index ───────────────────────────────────────────
// Only MEMORY.md — its one-line-per-memory entries are concise and topical, so
// token overlap is meaningful. The per-file bodies are token-rich paragraphs
// that produce false matches, so they are deliberately excluded.
function loadMemory() {
  const index = join(MEMORY_DIR, "MEMORY.md");
  if (!existsSync(index)) return { lines: [], available: false };
  const lines = readFileSync(index, "utf8")
    .split("\n")
    .filter((l) => l.trim());
  return { lines, available: true };
}

function tokenize(text) {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 4 && !STOPWORDS.has(t)),
  );
}

function bodyPrRefs(body) {
  const refs = new Set();
  let m;
  while ((m = PR_REF_RE.exec(body)) !== null) refs.add(m[1]);
  return [...refs];
}

// ── Per-story verdict ─────────────────────────────────────────────────────
function assess(story, merged, memory) {
  const fm = story.frontmatter ?? {};
  const evidence = [];
  let verdict = "likely-open";

  // 1. pr: frontmatter
  const fmPr = fm.pr != null ? String(fm.pr) : null;
  if (fmPr) {
    if (!merged.available) evidence.push(`pr:${fmPr} (merge-state unchecked — gh unavailable)`);
    else if (merged.byNumber.has(fmPr)) {
      evidence.push(`pr:${fmPr} merged`);
      verdict = "likely-done";
    } else evidence.push(`pr:${fmPr} NOT in merged list`);
  }

  // 2. #NNNN refs in body
  const refs = bodyPrRefs(story.body ?? "");
  const mergedRefs = refs.filter((r) => merged.byNumber.has(r));
  if (mergedRefs.length) {
    evidence.push(`body refs merged: ${mergedRefs.map((r) => "#" + r).join(", ")}`);
    if (verdict !== "likely-done") verdict = "likely-done";
  }

  // 3. memory done-hint (story id tokens or title tokens land on a done line)
  if (memory.available) {
    const idToks = tokenize(story.id.replace(/-/g, " "));
    const titleToks = tokenize(fm.title ?? "");
    const want = new Set([...idToks, ...titleToks]);
    const hit = memory.lines.find(
      (l) => DONE_WORDS.test(l) && [...want].filter((t) => l.toLowerCase().includes(t)).length >= 3,
    );
    if (hit) {
      evidence.push(`memory: "${hit.trim().slice(0, 80)}"`);
      if (verdict !== "likely-done") verdict = "likely-done";
    }
  }

  // 4. weak title overlap with a merged PR (only to enrich, never decisive)
  if (verdict !== "likely-done" && merged.available) {
    const titleToks = tokenize(fm.title ?? "");
    let best = null;
    for (const pr of merged.titles) {
      const overlap = [...titleToks].filter((t) => pr.tokens.has(t)).length;
      if (overlap >= 3 && (!best || overlap > best.overlap)) best = { ...pr, overlap };
    }
    if (best) evidence.push(`weak title match → trails #${best.number} (${best.overlap} tokens)`);
  }

  // blocked stories need a human blocker re-check regardless
  if (verdict === "likely-open" && fm.status === "blocked") {
    verdict = "unknown";
    evidence.push("status:blocked — re-verify blocker still exists");
  }
  if (!evidence.length) evidence.push("no shipped-signal found");

  return { id: story.id, rfc: story.rfc, status: fm.status ?? "?", verdict, evidence };
}

// ── Main ──────────────────────────────────────────────────────────────────
const { stories } = loadAll();
const targets = stories
  .filter((s) => EXISTING_RFC_RE.test(s.rfc) && !s.error)
  .sort((a, b) => (a.rfc + a.id).localeCompare(b.rfc + b.id));

const merged = loadMergedPRs();
const memory = loadMemory();
const results = targets.map((s) => assess(s, merged, memory));

if (JSON_OUT) {
  console.log(
    JSON.stringify(
      {
        sources: { mergedPRs: merged.available, memory: memory.available },
        counts: tally(results),
        results,
      },
      null,
      2,
    ),
  );
} else {
  const sources = `sources: merged-PRs=${merged.available ? merged.byNumber.size : "UNAVAILABLE"}, memory=${memory.available ? memory.lines.length + " lines" : "UNAVAILABLE"}`;
  console.log(sources + "\n");
  let rfc = "";
  for (const r of results) {
    if (r.rfc !== rfc) {
      rfc = r.rfc;
      console.log(`\n## ${rfc}`);
    }
    console.log(`  [${r.verdict.padEnd(11)}] ${r.id}  (was: ${r.status})`);
    for (const e of r.evidence) console.log(`      · ${e}`);
  }
  const c = tally(results);
  console.log(
    `\ntotals: ${c["likely-done"] ?? 0} likely-done · ${c["likely-open"] ?? 0} likely-open · ${c.unknown ?? 0} unknown  (of ${results.length})`,
  );
}

function tally(rs) {
  const c = {};
  for (const r of rs) c[r.verdict] = (c[r.verdict] ?? 0) + 1;
  return c;
}
