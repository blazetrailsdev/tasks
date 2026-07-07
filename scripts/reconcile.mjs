#!/usr/bin/env node
// Read-only reconcile report (RFC 0024, story reconcile-all-active-rfcs).
//
// For every story in a non-terminal RFC (status draft / active / postponed),
// gather shipped-signals and print a triage verdict — likely-done /
// likely-open / unknown — with the evidence behind it. This NEVER edits story
// frontmatter; it only reports. A human (or a follow-up `tasks done`/`refine`)
// consumes the output and applies status flips.
//
// The "ready ≠ undone, verify before claiming" drift it catches applies to
// every RFC: a story silently goes stale whenever its PR merges without the
// agent flipping status. The summary footer surfaces that drift as a single
// number — likely-done stories not yet marked `done` — so a periodic run
// (cron, or a spawn-loop preamble) can alert on one line.
//
// Signals:
//   1. `pr:` frontmatter set       → is that trails PR merged?
//   2. `#NNNN` refs in the body     → are those trails PRs merged?
//   3. memory-index seed            → a memory line names the story as
//                                     done/shipped/resolved/no-op
//   4. trails merged-PR title match → distinctive token overlap. Non-decisive
//                                     (enriches evidence only, never sets the
//                                     verdict): at full RFC scope title-token
//                                     overlap is too noisy to be trusted alone.
//
// Usage:
//   node scripts/reconcile.mjs            # all non-terminal RFCs, human table
//   node scripts/reconcile.mjs --rfc 0024-tasks-cli-coverage   # one RFC
//   node scripts/reconcile.mjs --json     # machine-readable (incl. per-row rfc)
//
// Env:
//   TRAILS_REPO   default "blazetrailsdev/trails" (passed to `gh --repo`)
//   MEMORY_DIR    default the Claude project memory dir; skipped if absent.

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { loadAll } from "./lib.mjs";

const JSON_OUT = process.argv.includes("--json");
const RFC_ARG = argValue("--rfc"); // restrict to one RFC (dir name or bare slug)
const NON_TERMINAL = new Set(["draft", "active", "postponed"]);
const TRAILS_REPO = process.env.TRAILS_REPO ?? "blazetrailsdev/trails";
const MEMORY_DIR =
  process.env.MEMORY_DIR ??
  join(process.env.HOME ?? "", ".claude/projects/-home-dean-github-blazetrailsdev-trails/memory");

const PR_REF_RE = /#(\d{2,5})\b/g;
const DONE_WORDS = /\b(shipped|done|resolved|no-?op|already|complete|closed|merged)\b/i;
const STOPWORDS = new Set(
  (
    "the a an and or of to for in on via vs with into from is are be add adds added " +
    "fix fixes fixed wire route remove drop test tests story rfc pr ar make support " +
    "via through per use using new"
  ).split(" "),
);

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return null;
  const v = process.argv[i + 1];
  if (v == null || v.startsWith("--")) {
    console.error(`error: ${flag} requires a value`);
    process.exit(2);
  }
  return v;
}

// Which decisive signal earned a likely-done verdict (title overlap is
// non-decisive, so never appears here). pr is the strongest; memory/body are
// weaker and prone to false positives at full scope — segmenting the drift
// footer by this lets a cron alert on the high-confidence count, not the noise.
function decisiveSignal(result) {
  if (result.evidence.some((e) => /^pr:\d+ merged$/.test(e))) return "pr";
  if (result.evidence.some((e) => e.startsWith("body refs merged"))) return "body";
  if (result.evidence.some((e) => e.startsWith("memory:"))) return "memory";
  return "other";
}

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
const { rfcs, stories } = loadAll();
// dir → RFC status, so we can scope to non-terminal RFCs by default.
const rfcStatus = new Map(rfcs.map((r) => [r.dir, r.frontmatter?.status ?? null]));

// `--rfc <slug>` accepts the full dir name (`0024-tasks-cli-coverage`), the
// bare number (`0024`; pass `0000` to match `0000-` placeholders), or the slug
// without the number prefix. Scoping to one RFC ignores its status, so a
// closed/superseded RFC can still be inspected explicitly.
function rfcMatchesArg(dir) {
  if (dir === RFC_ARG) return true;
  const num = dir.match(/^(\d{4}|draft)-/)?.[1];
  const slug = dir.replace(/^(?:\d{4}|draft)-/, "");
  return RFC_ARG === num || RFC_ARG === slug;
}

// In default scope, an RFC whose status can't be resolved (missing/unparseable
// README) would silently drop all its stories. Flag it on stderr so a broken
// RFC surfaces as a warning instead of vanishing from the report.
if (!RFC_ARG) {
  for (const r of rfcs) {
    if (rfcStatus.get(r.dir) == null) {
      console.error(`warning: ${r.dir} has no resolvable RFC status — excluded from default scope`);
    }
  }
}

const inScope = RFC_ARG
  ? (dir) => rfcMatchesArg(dir)
  : (dir) => NON_TERMINAL.has(rfcStatus.get(dir));

const targets = stories
  .filter((s) => inScope(s.rfc) && !s.error)
  .sort((a, b) => (a.rfc + a.id).localeCompare(b.rfc + b.id));

const merged = loadMergedPRs();
const memory = loadMemory();
const results = targets.map((s) => assess(s, merged, memory));

// Actionable drift: stories the signals say shipped but whose status hasn't
// been flipped to `done`. Segment by decisive signal — `pr:`-backed drift is
// high-confidence; `body`/`memory` are noisier (e.g. surfaced-deviations
// stories cite their surfacing PR, not a convergence PR), so a cron should
// alert on the `pr` count, not the raw total.
const drift = results
  .filter((r) => r.verdict === "likely-done" && r.status !== "done" && r.status !== "closed")
  .map((r) => ({ rfc: r.rfc, id: r.id, status: r.status, signal: decisiveSignal(r) }));
const driftBySignal = tallyBy(drift, (d) => d.signal);
const driftSegments = `pr=${driftBySignal.pr ?? 0}, body=${driftBySignal.body ?? 0}, memory=${driftBySignal.memory ?? 0}`;

if (JSON_OUT) {
  console.log(
    JSON.stringify(
      {
        sources: { mergedPRs: merged.available, memory: memory.available },
        scope: RFC_ARG ?? "non-terminal-rfcs",
        counts: tally(results),
        driftBySignal,
        drift,
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
  console.log(
    `drift: ${drift.length} likely-done stories not marked done (by signal: ${driftSegments}) — pr-backed is the high-confidence count`,
  );
  for (const r of drift) console.log(`  · [${r.signal}] ${r.rfc}/${r.id} (status: ${r.status})`);
}

function tally(rs) {
  return tallyBy(rs, (r) => r.verdict);
}

function tallyBy(rs, key) {
  const c = {};
  for (const r of rs) {
    const k = key(r);
    c[k] = (c[k] ?? 0) + 1;
  }
  return c;
}
