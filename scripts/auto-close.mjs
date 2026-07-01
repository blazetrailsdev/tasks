#!/usr/bin/env node
// Auto-close completed RFCs: flip any `status: active` RFC whose every story is
// `done` to `status: closed` and bump `updated` to today. Edits README
// frontmatter in place; it does NOT touch git or regenerate indices — the
// caller (the btwhooks webhook handler) runs build-index and commits/pushes.
//
// Closing rules (kept in lockstep with validate-lib.mjs's closed-RFC check):
//   - only `active` RFCs are eligible (draft/postponed/superseded are left
//     alone — closing those is a human decision);
//   - the RFC must have at least one story (a story-less RFC is not "done");
//   - every story must be terminal — `done` (shipped) or `closed`
//     (superseded/abandoned without code). Both are legitimate final states, so
//     an RFC whose remaining work was all closed out still qualifies.
//
// Output: a single machine-readable marker line the handler greps for —
//   AUTO_CLOSE_CLOSED=0031-...,0040-...   (comma-joined dirs, empty if none)
// plus human-readable log lines. Exits 0 on success (even when nothing
// qualifies), non-zero only on an unexpected error.
//
//   node scripts/auto-close.mjs [--dry-run]
//
import { readFileSync, writeFileSync } from "node:fs";
import { loadAll } from "./lib.mjs";

const dryRun = process.argv.slice(2).includes("--dry-run");

// YYYY-MM-DD in local time, matching the unquoted date style of existing
// created:/updated: frontmatter.
const today = (() => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
})();

const { rfcs, stories } = loadAll();

const storiesByRfc = new Map();
for (const s of stories) {
  if (!storiesByRfc.has(s.rfc)) storiesByRfc.set(s.rfc, []);
  storiesByRfc.get(s.rfc).push(s);
}

const closed = [];
for (const rfc of rfcs) {
  if (rfc.frontmatter?.status !== "active") continue;
  const own = storiesByRfc.get(rfc.dir) ?? [];
  if (own.length === 0) continue; // no stories → not "done"
  const isTerminal = (st) => st === "done" || st === "closed";
  if (!own.every((s) => isTerminal(s.frontmatter?.status))) continue;

  // Rewrite only inside the frontmatter block so a stray `status:`/`updated:`
  // line in the body can never be hit.
  const m = rfc.raw.match(/^(---\n)([\s\S]*?)(\n---\n?)([\s\S]*)$/);
  if (!m) {
    console.error(`auto-close: ${rfc.dir} has no parseable frontmatter — skipping`);
    continue;
  }
  let fm = m[2];
  fm = fm.replace(/^status:[ \t]*active[ \t]*$/m, "status: closed");
  fm = fm.replace(/^updated:[ \t]*.*$/m, `updated: ${today}`);
  const next = m[1] + fm + m[3] + m[4];

  console.log(`auto-close: ${rfc.dir} (${own.length} stories done/closed) active → closed`);
  if (!dryRun) writeFileSync(rfc.file, next);
  closed.push(rfc.dir);
}

if (closed.length === 0) console.log("auto-close: nothing to close");
else if (dryRun) console.log(`auto-close: dry run — ${closed.length} RFC(s) would close`);

console.log(`AUTO_CLOSE_CLOSED=${closed.join(",")}`);
