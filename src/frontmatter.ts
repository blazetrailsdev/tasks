/**
 * Frontmatter parsing and in-place mutation.
 *
 * PORTED VERBATIM from the old CLI (scripts/cli.ts:926-1051). `tasks export` is
 * the only caller now: it writes DB-owned fields back into story frontmatter so
 * stories stay readable on github.com. Keeping the writer byte-identical means
 * the export produces the same formatting the repo already has, so the first
 * export after cutover is a no-op diff rather than a 7,137-file reformat.
 */
import { readFileSync, writeFileSync } from "node:fs";

// Canonical frontmatter key order, mirrors buildStoryContent. Used by
// setFrontmatterList to insert an absent key in its conventional slot rather
// than appending at the end of the block.
const FRONTMATTER_KEY_ORDER = [
  "title",
  "status",
  "updated",
  "rfc",
  "cluster",
  "packages",
  "deps",
  "deps-rfc",
  "est-loc",
  "priority",
  "pr",
  "claim",
  "assignee",
  "blocked-by",
  "closed-reason",
];

// Splits a story file into its frontmatter delimiters, the key/value lines
// inside the fenced block, and the body. Exits when the file has no fenced
// frontmatter. Shared by every frontmatter mutator so they parse identically.
function splitFrontmatter(file: string): {
  open: string;
  lines: string[];
  close: string;
  body: string;
} {
  const text = readFileSync(file, "utf8");
  const m = text.match(/^(---\n)([\s\S]*?)(\n---\n)([\s\S]*)$/);
  if (!m) {
    console.error(`error: ${file} has no frontmatter block`);
    process.exit(1);
  }
  return { open: m[1], lines: m[2].split("\n"), close: m[3], body: m[4] };
}

// Edits **single-line scalar** frontmatter fields only. Refuses to
// edit a key whose immediate next line is indented (i.e. a YAML list or
// nested map) — overwriting the key would orphan its children. The
// fields the CLI mutates today (status, claim, assignee, pr, blocked-by)
// are always scalars; refusing on lists is defensive.
export function editFrontmatter(file: string, edits: Record<string, string>): void {
  const { open, lines, close, body } = splitFrontmatter(file);
  for (const [key, value] of Object.entries(edits)) {
    let found = false;
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].match(new RegExp(`^${key}:(\\s|$)`))) continue;
      const next = lines[i + 1];
      if (next && /^[ \t]/.test(next)) {
        console.error(`error: refusing to edit list-valued frontmatter key "${key}" in ${file}`);
        process.exit(1);
      }
      lines[i] = `${key}: ${value}`;
      found = true;
      break;
    }
    if (!found) lines.push(`${key}: ${value}`);
  }
  writeFileSync(file, open + lines.join("\n") + close + body);
}

// Deletes a **single-line scalar** frontmatter key. No-op when the key is
// already absent. Refuses list/nested keys for the same reason editFrontmatter
// does — removing the key alone would orphan its indented children.
export function removeFrontmatterKey(file: string, key: string): void {
  const { open, lines, close, body } = splitFrontmatter(file);
  const i = lines.findIndex((l) => new RegExp(`^${key}:(\\s|$)`).test(l));
  if (i === -1) return;
  if (lines[i + 1] && /^[ \t]/.test(lines[i + 1])) {
    console.error(`error: refusing to remove list-valued frontmatter key "${key}" in ${file}`);
    process.exit(1);
  }
  lines.splice(i, 1);
  writeFileSync(file, open + lines.join("\n") + close + body);
}

// Sets a **list-valued** frontmatter key, the array-block counterpart to
// editFrontmatter's scalar editor. Replaces the key's existing value whether
// it is inline flow (`deps: [a, b]`) or an indented block list, rendering an
// empty list inline (`[]`) and a non-empty list as a block. Inserts the key in
// its canonical position (per FRONTMATTER_KEY_ORDER) when absent. Every other
// line — sibling keys, inline comments, blank lines, body — is preserved
// byte-for-byte. Refuses anything deeper than a simple list (a nested map, or
// list items with their own indented children) for the same defensive reason
// editFrontmatter refuses lists: it cannot safely rewrite structure it does
// not model.
export function setFrontmatterList(file: string, key: string, items: string[]): void {
  const { open, lines, close, body } = splitFrontmatter(file);
  const rendered =
    items.length === 0 ? [`${key}: []`] : [`${key}:`, ...items.map((it) => `  - ${it}`)];

  const idx = lines.findIndex((l) => new RegExp(`^${key}:(\\s|$)`).test(l));
  if (idx === -1) {
    const ki = FRONTMATTER_KEY_ORDER.indexOf(key);
    let insertAt = lines.length;
    if (ki !== -1) {
      for (let i = 0; i < lines.length; i++) {
        const km = lines[i].match(/^([\w-]+):/);
        if (km && FRONTMATTER_KEY_ORDER.indexOf(km[1]) > ki) {
          insertAt = i;
          break;
        }
      }
    }
    lines.splice(insertAt, 0, ...rendered);
  } else {
    // Consume the key line plus any immediately following indented child lines
    // (the existing block list). A child that is not a `- scalar` item is a
    // nested map or multi-level structure we refuse to rewrite.
    let end = idx + 1;
    while (end < lines.length && /^[ \t]/.test(lines[end])) {
      if (!/^[ \t]+-\s/.test(lines[end])) {
        console.error(
          `error: refusing to set nested/multi-level frontmatter key "${key}" in ${file}`,
        );
        process.exit(1);
      }
      end++;
    }
    lines.splice(idx, end - idx, ...rendered);
  }
  writeFileSync(file, open + lines.join("\n") + close + body);
}
