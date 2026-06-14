// Regenerates the `## Stories` table in each RFC README from story
// frontmatter. The table is a generated view of frontmatter, so any
// hand-authored variation (sub-grouping, extra columns, prose) inside the
// Stories section is intentionally replaced — frontmatter is the single
// source of truth and the table must never drift from it.
//
// The generated region runs from the `## Stories` heading to the next `##`
// heading (or end of file); a marker comment is emitted so readers know not
// to hand-edit. READMEs without a `## Stories` heading are left untouched.
// Output is deterministic (stable sort by status then id), so reruns are
// idempotent. validate.mjs uses the same builder to fail on stale tables.
//
// Run directly (`node scripts/stories-table.mjs`) to rewrite all READMEs in
// place; the pre-commit hook invokes it before prettier so generated tables
// are formatted, not rejected. Kept a sibling of build-index.mjs (rather than
// folded into it) so the index rebuild that `loadIndex()` triggers on read
// commands never mutates tracked README files as a side effect.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadAll, STORY_STATUSES } from "./lib.mjs";

export const STORIES_MARKER = "<!-- generated: stories table -->";

const statusRank = (s) => {
  const i = STORY_STATUSES.indexOf(s);
  return i === -1 ? STORY_STATUSES.length : i;
};

// Markdown table cells are pipe-delimited, so any literal pipe must be escaped
// or it splits the cell. Underscores and asterisks are escaped too: prettier
// (run by the pre-commit hook) reads an unescaped `_and_` in a title as
// emphasis and rewrites the markers to `*`, corrupting the rendered title and
// drifting the committed table from this builder's output. Escaping stops
// prettier from re-interpreting them; normalizeStoriesRegion strips the escapes
// back out before comparing, so committed and generated tables stay equal.
const cell = (v) => String(v).replace(/[\\|_*]/g, "\\$&");

export function buildStoriesTable(stories) {
  const sorted = [...stories].sort(
    (a, b) =>
      statusRank(a.frontmatter?.status) - statusRank(b.frontmatter?.status) ||
      a.id.localeCompare(b.id),
  );
  const lines = ["| ID | Title | Status | Est LOC | Cluster |", "| --- | --- | --- | --- | --- |"];
  for (const s of sorted) {
    const fm = s.frontmatter ?? {};
    const id = `[${s.id}](stories/${s.id}.md)`;
    const estLoc = fm["est-loc"] ?? "null";
    lines.push(
      `| ${cell(id)} | ${cell(fm.title ?? "—")} | ${cell(fm.status ?? "—")} | ${cell(estLoc)} | ${cell(fm.cluster ?? "—")} |`,
    );
  }
  return lines.join("\n");
}

// Returns the rewritten README text, or null if it has no `## Stories`
// heading (left untouched).
//
// Only the marker + table is generated; any author prose around it inside the
// `## Stories` section (e.g. RFC 0019's per-PR `Est LOC` note) is preserved.
// The marker and the markdown table rows are the generated content; everything
// else between `## Stories` and the next `##` is kept verbatim, split into the
// prose before the table and the prose after it.
export function regenerateReadmeText(raw, stories) {
  const lines = raw.split("\n");
  const start = lines.findIndex((l) => l === "## Stories");
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) {
      end = i;
      break;
    }
  }
  const region = lines.slice(start + 1, end).filter((l) => l !== STORIES_MARKER);
  const isRow = (l) => /^\s*\|/.test(l);
  const first = region.findIndex(isRow);
  let last = -1;
  for (let i = region.length - 1; i >= 0; i--) {
    if (isRow(region[i])) {
      last = i;
      break;
    }
  }
  const trim = (arr) => {
    const a = [...arr];
    while (a.length && a[0].trim() === "") a.shift();
    while (a.length && a[a.length - 1].trim() === "") a.pop();
    return a;
  };
  const intro = trim(first === -1 ? region : region.slice(0, first));
  const post = trim(last === -1 ? [] : region.slice(last + 1));
  const block = [
    "## Stories",
    "",
    ...(intro.length ? [...intro, ""] : []),
    STORIES_MARKER,
    "",
    buildStoriesTable(stories),
    "",
    ...(post.length ? [...post, ""] : []),
  ];
  return [...lines.slice(0, start), ...block, ...lines.slice(end)].join("\n");
}

function storiesByRfc(stories) {
  const byRfc = new Map();
  for (const s of stories) {
    if (!byRfc.has(s.rfc)) byRfc.set(s.rfc, []);
    byRfc.get(s.rfc).push(s);
  }
  return byRfc;
}

// Normalize a Stories region for comparison: collapse whitespace and drop the
// table alignment row, so prettier's column padding doesn't read as drift.
export function normalizeStoriesRegion(raw) {
  const lines = raw.split("\n");
  const start = lines.findIndex((l) => l === "## Stories");
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) {
      end = i;
      break;
    }
  }
  return (
    lines
      .slice(start, end)
      // Collapse prettier's column padding, drop the alignment row, and strip
      // prettier's markdown escapes (`\_`, `\*`, `\|`, …) so the formatted commit
      // compares equal to this builder's raw output.
      .map((l) =>
        l
          .replace(/\s+/g, " ")
          .replace(/\\(\W|_)/g, "$1")
          .trim(),
      )
      .filter((l) => l && !/^\|[\s|:-]+\|$/.test(l))
      .join("\n")
  );
}

// Returns the list of RFC dirs whose committed Stories table is stale.
export function staleStoriesTables(rfcs, stories) {
  const byRfc = storiesByRfc(stories);
  const stale = [];
  for (const r of rfcs) {
    if (r.error) continue;
    const next = regenerateReadmeText(r.raw, byRfc.get(r.dir) ?? []);
    if (next === null) continue;
    if (normalizeStoriesRegion(r.raw) !== normalizeStoriesRegion(next)) stale.push(r.dir);
  }
  return stale;
}

// Rewrites stale README files in place; returns the paths changed.
export function regenerateStoriesTables(rfcs, stories) {
  const byRfc = storiesByRfc(stories);
  const changed = [];
  for (const r of rfcs) {
    if (r.error) continue;
    const next = regenerateReadmeText(r.raw, byRfc.get(r.dir) ?? []);
    if (next !== null && next !== r.raw) {
      writeFileSync(r.file, next);
      changed.push(r.file);
    }
  }
  return changed;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { rfcs, stories } = loadAll();
  const changed = regenerateStoriesTables(rfcs, stories);
  console.log(`stories tables: ${changed.length} README(s) regenerated`);
}
