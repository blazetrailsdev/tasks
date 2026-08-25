/**
 * CI guard: reject any PR that edits a DB-owned frontmatter field.
 *
 * This is what turns the ownership split from a convention into a rule.
 *
 * Without it, an agent that hand-edits `status: done` in a story file gets a PR
 * that merges cleanly, reads correctly to a human, and changes NOTHING — ingest
 * skips DB-owned columns by design. That is the worst available failure mode:
 * silent, and indistinguishable from success. This makes it a loud CI red that
 * names the verb to use instead.
 *
 * Compares against the merge base so it only judges what the PR itself changed.
 */
import { execFileSync } from "node:child_process";
import { DB_OWNED } from "../src/ingest.js";

const BASE = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : "origin/main";

const VERB_FOR: Record<string, string> = {
  status: "tasks status-set <id> <status> (or claim/done/block/close)",
  pr: "tasks in-progress <id> --pr N / tasks done <id> --pr N",
  claim: "tasks claim <id>",
  assignee: "tasks claim <id> --assignee <name>",
  "blocked-by": "tasks block <id> <reason>",
  "closed-reason": "tasks close <id> <reason>",
  updated: "(stamped automatically by any mutation verb)",
};

function git(args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function main(): void {
  let base = BASE;
  try {
    base = git(["merge-base", "HEAD", BASE]).trim() || BASE;
  } catch {
    // Shallow clone or missing remote ref — fall back to the ref itself.
  }

  let diff: string;
  try {
    diff = git(["diff", "-U0", base, "HEAD", "--", "rfcs/"]);
  } catch (e) {
    console.error(`could not diff against ${base}: ${(e as Error).message}`);
    process.exit(0); // Don't fail the build on a diff we can't compute.
  }

  const violations: { file: string; field: string; line: string }[] = [];
  let file = "";
  let inFrontmatter = false;
  let sawOpeningFence = false;

  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ b/")) {
      file = line.slice(6);
      inFrontmatter = false;
      sawOpeningFence = false;
      continue;
    }
    if (line.startsWith("@@")) {
      // Hunk headers reset our position; we can't track fences across hunks, so
      // treat any hunk touching a `key:` at column 0 in a story file as
      // frontmatter-ish and let the field allowlist do the discriminating.
      inFrontmatter = true;
      sawOpeningFence = false;
      continue;
    }
    if (!file.endsWith(".md")) continue;
    if (!(line.startsWith("+") || line.startsWith("-"))) continue;

    const content = line.slice(1);
    if (content.trim() === "---") {
      sawOpeningFence = !sawOpeningFence;
      continue;
    }
    if (!inFrontmatter) continue;

    const key = /^([a-z-]+):/.exec(content)?.[1];
    if (!key) continue;
    if (!(DB_OWNED as readonly string[]).includes(key)) continue;
    // Only additions are violations; a deletion paired with an identical
    // addition is just reformatting, and prettier does that on main.
    if (line.startsWith("+")) violations.push({ file, field: key, line: content.trim() });
  }

  if (violations.length === 0) {
    console.log("owned-fields: OK — no DB-owned frontmatter fields changed");
    process.exit(0);
  }

  console.error("\nDB-owned frontmatter fields were edited by hand.\n");
  console.error("These fields live in the database, not in the file. Ingest ignores them,");
  console.error("so this change would merge cleanly and then do nothing at all.\n");
  const seen = new Set<string>();
  for (const v of violations) {
    const k = `${v.file}:${v.field}`;
    if (seen.has(k)) continue;
    seen.add(k);
    console.error(`  ${v.file}`);
    console.error(`    ${v.line}`);
    console.error(`    use: ${VERB_FOR[v.field] ?? `tasks ${v.field} ...`}\n`);
  }
  process.exit(1);
}

main();
