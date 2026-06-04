#!/usr/bin/env node
// Finalize a placeholder RFC: assign the next free sequential number, rename
// the directory, rewrite every `0000-<slug>` reference to `NNNN-<slug>`, inject
// the number into the README H1 (`# RFC — Title` → `# RFC NNNN — Title`), and
// rebuild the indices.
//
// Run this on the RFC's PR branch right before merge — `main` only ever holds
// numbered RFCs; `0000-*` placeholders live on PR branches.
//
//   node scripts/finalize-rfc.mjs 0000-<slug> [--dry-run]
//
// Legacy `draft-<slug>` placeholders are still accepted for in-flight PRs.
//
import {
  readdirSync,
  renameSync,
  readFileSync,
  writeFileSync,
  existsSync,
  statSync,
} from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { REPO_ROOT } from "./lib.mjs";

const RFCS = join(REPO_ROOT, "rfcs");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const draftDir = args.find((a) => !a.startsWith("--"));

const prefix = draftDir?.startsWith("0000-")
  ? "0000-"
  : draftDir?.startsWith("draft-")
    ? "draft-"
    : null;
if (!draftDir || !prefix) {
  console.error("usage: node scripts/finalize-rfc.mjs 0000-<slug> [--dry-run]");
  process.exit(1);
}
const slug = draftDir.slice(prefix.length);
if (!slug) {
  console.error("error: placeholder slug is empty");
  process.exit(1);
}

const src = join(RFCS, draftDir);
if (!existsSync(src) || !statSync(src).isDirectory()) {
  console.error(`error: no such placeholder RFC dir: rfcs/${draftDir}`);
  process.exit(1);
}

// Next free 4-digit integer across existing numbered dirs (0000-template counts
// as 0, which never wins the max).
const used = readdirSync(RFCS)
  .map((d) => /^(\d{4})-/.exec(d))
  .filter(Boolean)
  .map((m) => Number(m[1]));
const next = String((used.length ? Math.max(...used) : 0) + 1).padStart(4, "0");
const newId = `${next}-${slug}`;
const dst = join(RFCS, newId);

if (existsSync(dst)) {
  console.error(`error: target rfcs/${newId} already exists`);
  process.exit(1);
}

// Files whose contents reference the draft id (README + every story).
const storiesDir = join(src, "stories");
const mdFiles = [
  join(src, "README.md"),
  ...(existsSync(storiesDir)
    ? readdirSync(storiesDir)
        .filter((f) => f.endsWith(".md"))
        .map((f) => join(storiesDir, f))
    : []),
];

console.log(`finalize: rfcs/${draftDir} → rfcs/${newId}${dryRun ? "  (dry run)" : ""}`);
for (const f of mdFiles) {
  let text = readFileSync(f, "utf8");
  const before = text;
  text = text.split(draftDir).join(newId); // draft-<slug> → NNNN-<slug>
  if (f.endsWith("README.md")) {
    text = text.replace(/^# RFC —/m, `# RFC ${next} —`); // inject number into H1
  }
  if (text !== before) console.log(`  rewrite ${f.slice(REPO_ROOT.length + 1)}`);
  if (!dryRun) writeFileSync(f, text);
}

if (dryRun) {
  console.log("dry run — no files changed.");
  process.exit(0);
}

renameSync(src, dst);
console.log(`  renamed dir → rfcs/${newId}`);
execFileSync("node", [join(REPO_ROOT, "scripts", "build-index.mjs")], { stdio: "inherit" });
console.log("done. Review, `git add -A`, commit, and merge the PR.");
