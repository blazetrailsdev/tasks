/**
 * Rehome: move a story to a different RFC.
 *
 * Like `new`, this is a MARKDOWN act, not a database one. A story's RFC is a
 * markdown-owned field (see ingest.ts's ownership split) and its identity on
 * disk is the path `rfcs/<rfc>/stories/<slug>.md`, so re-homing means moving
 * the file and rewriting its `rfc:` line — then letting ingest project the
 * change into the DB, exactly as it does for a story authored by hand in a PR.
 *
 * Writing `rfc_id` directly would leave `file_path` pointing at the old RFC's
 * directory, and the very next ingest of that path would read the file that is
 * still sitting there and put the story straight back.
 *
 * Ingest already models this move: a story file that vanishes from one RFC and
 * reappears under another is a rename, not an abandonment (`movedElsewhere`),
 * so the row keeps its history — every claim, PR and event — and is not closed
 * on the way through.
 *
 * The caller: an RFC being sunset re-homes the drafts that still have life in
 * them rather than closing work nobody decided to abandon.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { Rfc, Story } from "./models/index.js";
import { currentBranch, mainWorktree } from "./db-path.js";
import { VerbExit } from "./db.js";
import { editFrontmatter } from "./frontmatter.js";
import { pushMain } from "./export.js";
import { ingest } from "./ingest.js";

export interface RehomeResult {
  moved: { id: string; from: string; to: string }[];
  committed: boolean;
}

/**
 * Move stories under a new RFC: git mv the files, rewrite `rfc:`, commit, and
 * ingest.
 *
 * All-or-nothing on validation (an unknown story or a terminal destination
 * refuses the whole batch), because a half-moved sunset leaves the operator
 * guessing which stories still need a home. The moves themselves are one
 * commit for the same reason.
 */
export async function rehome(
  ids: string[],
  toRfc: string,
  opts: { reason?: string | null; commit?: boolean } = {},
): Promise<RehomeResult> {
  // Author into the MAIN working tree, never the caller's worktree — a move
  // committed onto an agent's feature branch strands the story there. Same
  // rule, and the same reason, as `tasks new`.
  const tasksDir = mainWorktree();
  const branch = currentBranch(tasksDir);
  if (branch !== "main") {
    console.error(
      `error: ${tasksDir} is on ${branch ?? "a detached HEAD"}, not main — refusing to rehome.`,
    );
    throw new VerbExit(1);
  }

  const dest = await Rfc.findBy({ id: toRfc });
  if (!dest) {
    console.error(`error: no such RFC "${toRfc}"`);
    throw new VerbExit(1);
  }
  // A terminal RFC cannot take work: `pnpm validate` rejects a closed RFC that
  // holds an unfinished story, which is a red CI on main for everyone. Same
  // guard `tasks new` carries, for the same failure.
  if (dest.status === "closed" || dest.status === "superseded") {
    console.error(
      `error: RFC ${toRfc} is ${dest.status} — it cannot take stories.\n` +
        `  Reopen it, or pick an active RFC.`,
    );
    throw new VerbExit(1);
  }

  const git = (args: string[]): string =>
    execFileSync("git", args, { cwd: tasksDir, encoding: "utf8" }).trim();

  const planned: { id: string; from: string; to: string }[] = [];
  for (const id of ids) {
    const s = await Story.findBy({ id });
    if (!s) {
      console.error(`error: story not found: ${id}`);
      throw new VerbExit(1);
    }
    if (s.rfc_id === toRfc) {
      console.log(`rehome ${id} (already under ${toRfc}, skipped)`);
      continue;
    }
    const from = s.file_path ?? join("rfcs", s.rfc_id, "stories", `${id}.md`);
    if (!existsSync(join(tasksDir, from))) {
      console.error(`error: ${id}: ${from} does not exist — nothing to move`);
      throw new VerbExit(1);
    }
    const to = join("rfcs", toRfc, "stories", `${id}.md`);
    if (existsSync(join(tasksDir, to))) {
      console.error(`error: ${to} already exists`);
      throw new VerbExit(1);
    }
    planned.push({ id, from, to });
  }
  if (planned.length === 0) return { moved: [], committed: false };

  for (const m of planned) {
    mkdirSync(dirname(join(tasksDir, m.to)), { recursive: true });
    git(["mv", "--", m.from, m.to]);
    editFrontmatter(join(tasksDir, m.to), { rfc: `"${toRfc}"` });
    // Stage only these files — never `git add -A`, which would sweep up an
    // agent's in-flight edits sitting in the same worktree.
    git(["add", "--", m.to]);
    console.log(`rehomed ${m.id} -> ${toRfc}`);
  }

  let committed = false;
  if (opts.commit !== false) {
    const what = planned.length === 1 ? planned[0].id : `${planned.length} stories`;
    const reason = opts.reason?.trim();
    git(["commit", "-q", "-m", `rehome: ${what} -> ${toRfc}${reason ? `\n\n${reason}` : ""}`]);
    pushMain(git, "tasks rehome");
    committed = true;
    // Project the move into the DB the same way a merged PR would. Ingest
    // reads git, so it has to run AFTER the commit.
    await ingest();
  }

  return { moved: planned, committed };
}
