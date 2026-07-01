// Shared helpers for build-index.mjs and validate.mjs.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// RFCs live under rfcs/ inside the tasks repo; the repo root holds the
// generated indices (index.md/json, search.json) and tooling.
export const RFCS_ROOT = join(REPO_ROOT, "rfcs");

// 0000-template/ is the literal starter directory — copy-this content
// with placeholder frontmatter that intentionally fails validation. It is
// the ONLY 0000-* dir excluded from index generation and validation.
//
// Two dir shapes count as RFCs: numbered `NNNN-slug` (merged, on main) and
// `0000-slug` placeholders (unnumbered, live on a PR branch). `0000-` is the
// "number not yet assigned" sentinel — it never collides with the `draft`
// lifecycle *status*, which the legacy `draft-slug` prefix did. Including
// placeholders means CI validates + indexes them before merge;
// `finalize-rfc.mjs` swaps `0000` for the assigned number (`0000-slug` →
// `NNNN-slug`) at merge time. Legacy `draft-slug` is still accepted so any
// in-flight pre-convention PR keeps working until it finalizes.
const RFC_DIR_RE = /^(?!0000-template$)(?:\d{4}|draft)-[a-z0-9][a-z0-9-]*$/;
const STORY_FILE_RE = /^[a-z0-9][a-z0-9-]*\.md$/;

export const RFC_STATUSES = ["draft", "active", "closed", "postponed", "superseded"];
export const STORY_STATUSES = [
  "draft",
  "ready",
  "claimed",
  "in-progress",
  "done",
  "blocked",
  "closed",
];

export function parseFrontmatter(filePath) {
  const text = readFileSync(filePath, "utf8");
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { frontmatter: null, body: text, lines: text.split("\n").length, raw: text };
  return {
    frontmatter: yaml.load(match[1]) ?? {},
    body: match[2],
    lines: text.split("\n").length,
    raw: text,
  };
}

export function loadAll() {
  const rfcs = [];
  const stories = [];
  for (const name of readdirSync(RFCS_ROOT)) {
    if (!RFC_DIR_RE.test(name)) continue;
    const rfcDir = join(RFCS_ROOT, name);
    if (!statSync(rfcDir).isDirectory()) continue;
    const readme = join(rfcDir, "README.md");
    let rfcEntry = null;
    try {
      const { frontmatter, body, lines, raw } = parseFrontmatter(readme);
      rfcEntry = { dir: name, file: readme, frontmatter, body, lines, raw };
      rfcs.push(rfcEntry);
    } catch (err) {
      rfcs.push({
        dir: name,
        file: readme,
        frontmatter: null,
        body: "",
        lines: 0,
        error: err.message,
      });
      continue;
    }
    const storiesDir = join(rfcDir, "stories");
    let entries;
    try {
      entries = readdirSync(storiesDir);
    } catch {
      continue;
    }
    for (const fname of entries) {
      if (!STORY_FILE_RE.test(fname)) continue;
      const file = join(storiesDir, fname);
      const id = fname.slice(0, -3);
      try {
        const { frontmatter, body, lines } = parseFrontmatter(file);
        stories.push({ id, rfc: name, file, frontmatter, body, lines });
      } catch (err) {
        stories.push({
          id,
          rfc: name,
          file,
          frontmatter: null,
          body: "",
          lines: 0,
          error: err.message,
        });
      }
    }
  }
  return { rfcs, stories };
}

export function firstHeading(body) {
  const m = body.match(/^#+\s+(.+)$/m);
  return m ? m[1].trim() : "";
}

export function relPath(absolute) {
  return absolute.startsWith(REPO_ROOT + "/") ? absolute.slice(REPO_ROOT.length + 1) : absolute;
}
