/**
 * rfc-status: move an RFC through its lifecycle — draft ⇄ active, or out to
 * closed / postponed.
 *
 * Like `rehome`, this is a MARKDOWN act. An RFC's `status:` is markdown-owned
 * (see ingest.ts): ingest re-reads it from the file on every pass, so writing
 * the row alone would be reverted by the next ingest. Instead the frontmatter
 * is rewritten, committed and pushed, and ingest projects it — exactly as it
 * would for the same flip made by hand in a PR.
 *
 * The caller: the dashboard's RFC page, whose status buttons shell out here.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Event, Rfc, Story, RFC_STATUSES, type RfcStatus } from "./models/index.js";
import { currentBranch, mainWorktree } from "./db-path.js";
import { VerbExit } from "./db.js";
import { editFrontmatter } from "./frontmatter.js";
import { pushMain } from "./export.js";
import { ingest } from "./ingest.js";

/**
 * The transitions this verb makes. `superseded` is deliberately absent: it
 * needs a `superseded-by` target, which is an authoring decision, not a click.
 * Reopening a closed RFC is likewise a PR, not a button.
 */
const ALLOWED: Record<RfcStatus, readonly RfcStatus[]> = {
  draft: ["active", "closed", "postponed"],
  active: ["draft", "closed", "postponed"],
  postponed: ["draft", "active", "closed"],
  closed: [],
  superseded: [],
};

export function rfcTransitionAllowed(from: RfcStatus, to: RfcStatus): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

const TERMINAL_STORY = new Set(["done", "closed"]);

export async function rfcStatusSet(
  id: string,
  to: string,
  opts: { reason?: string | null; commit?: boolean } = {},
): Promise<{ from: RfcStatus; to: RfcStatus; committed: boolean }> {
  if (!(RFC_STATUSES as readonly string[]).includes(to)) {
    console.error(`error: unknown RFC status "${to}" (one of: ${RFC_STATUSES.join(", ")})`);
    throw new VerbExit(1);
  }
  const target = to as RfcStatus;

  // Same rule as `new` and `rehome`: author into the main worktree, on main.
  const tasksDir = mainWorktree();
  const branch = currentBranch(tasksDir);
  if (branch !== "main") {
    console.error(
      `error: ${tasksDir} is on ${branch ?? "a detached HEAD"}, not main — refusing to set rfc status.`,
    );
    throw new VerbExit(1);
  }

  const rfc = await Rfc.findBy({ id });
  if (!rfc) {
    console.error(`error: no such RFC "${id}"`);
    throw new VerbExit(1);
  }
  const from = rfc.status;
  if (from === target) {
    console.log(`rfc ${id} already ${target}`);
    return { from, to: target, committed: false };
  }
  if (!rfcTransitionAllowed(from, target)) {
    console.error(`error: RFC ${id} is ${from} — cannot move it to ${target}.`);
    throw new VerbExit(1);
  }

  // `pnpm validate` rejects a closed RFC holding unfinished work — a red main
  // for everyone. Refuse here with the list instead; sunsetting (which
  // re-homes or closes the stragglers) is the path for an RFC with open work.
  if (target === "closed") {
    const open = (await Story.where({ rfc_id: id }).toArray()).filter(
      (s) => !TERMINAL_STORY.has(s.status),
    );
    if (open.length > 0) {
      const shown = open
        .slice(0, 5)
        .map((s) => s.id)
        .join(", ");
      console.error(
        `error: RFC ${id} still has ${open.length} unfinished stor${open.length === 1 ? "y" : "ies"} ` +
          `(${shown}${open.length > 5 ? ", …" : ""}) — close or rehome them first, or sunset the RFC.`,
      );
      throw new VerbExit(1);
    }
  }

  const rel = rfc.file_path ?? join("rfcs", id, "README.md");
  const abs = join(tasksDir, rel);
  if (!existsSync(abs)) {
    console.error(`error: ${rel} does not exist`);
    throw new VerbExit(1);
  }
  editFrontmatter(abs, { status: target, updated: new Date().toISOString().slice(0, 10) });
  console.log(`rfc ${id}: ${from} -> ${target}`);

  if (opts.commit === false) return { from, to: target, committed: false };

  const git = (args: string[]): string =>
    execFileSync("git", args, { cwd: tasksDir, encoding: "utf8" }).trim();
  // Stage only the RFC file — never `git add -A` (see rehome).
  git(["add", "--", rel]);
  const reason = opts.reason?.trim();
  git(["commit", "-q", "-m", `rfc(${id}): ${from} -> ${target}${reason ? `\n\n${reason}` : ""}`]);
  pushMain(git, "tasks rfc-status");
  // Ingest reads git, so it runs after the commit.
  await ingest();
  await Event.create({
    at: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
    verb: "rfc-status",
    story_id: null,
    rfc_id: id,
    pr: null,
    actor: null,
    detail: JSON.stringify({ from, to: target, note: reason ?? null }),
  });
  return { from, to: target, committed: true };
}
