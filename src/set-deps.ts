/**
 * set-deps / set-deps-rfc: edit a story's `deps` or `deps-rfc` array.
 *
 * Like `rehome`, this is a MARKDOWN act. Both arrays are markdown-owned (see
 * ingest.ts), so the file is rewritten, committed and pushed, and ingest
 * projects the new edges into the DB — exactly as a hand edit merged by PR
 * would. Without a verb, every refine that wires dependencies has to stop and
 * ask for leave to hand-edit frontmatter on main.
 *
 * The edit is checked against `pnpm validate`'s own dep-graph rules
 * (`checkDepGraph`) BEFORE the file is touched, so a dangling reference or a
 * new cycle is refused with no write and no commit rather than reddening main.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Story } from "./models/index.js";
import { currentBranch, mainWorktree } from "./db-path.js";
import { VerbExit } from "./db.js";
import { setFrontmatterList } from "./frontmatter.js";
import { pushMain } from "./export.js";
import { ingest } from "./ingest.js";
import { checkDepGraph, loadAll, stringList } from "./authoring.js";

export type DepsKey = "deps" | "deps-rfc";

/**
 * How to change the array: `set` replaces it outright (`[]` clears it); `add`
 * appends what is not already there, keeping the existing order; `remove` drops
 * the named items. `add` and `remove` may be combined.
 */
export type DepsEdit = { set: string[] } | { add?: string[]; remove?: string[] };

export interface SetDepsResult {
  from: string[];
  to: string[];
  committed: boolean;
}

export function applyDepsEdit(current: string[], edit: DepsEdit): string[] {
  if ("set" in edit) return [...new Set(edit.set)];
  const remove = new Set(edit.remove ?? []);
  const next = current.filter((d) => !remove.has(d));
  for (const d of edit.add ?? []) if (!remove.has(d) && !next.includes(d)) next.push(d);
  return next;
}

export async function setDeps(
  id: string,
  key: DepsKey,
  edit: DepsEdit,
  opts: { commit?: boolean } = {},
): Promise<SetDepsResult> {
  // Same rule as `new` and `rehome`: author into the main worktree, on main.
  const tasksDir = mainWorktree();
  const branch = currentBranch(tasksDir);
  const cmd = key === "deps" ? "set-deps" : "set-deps-rfc";
  if (branch !== "main") {
    console.error(
      `error: ${tasksDir} is on ${branch ?? "a detached HEAD"}, not main — refusing to ${cmd}.`,
    );
    throw new VerbExit(1);
  }

  const s = await Story.findBy({ id });
  if (!s) {
    console.error(`error: story not found: ${id}`);
    throw new VerbExit(1);
  }
  const rel = s.file_path ?? join("rfcs", s.rfc_id, "stories", `${id}.md`);
  const abs = join(tasksDir, rel);
  if (!existsSync(abs)) {
    console.error(`error: ${id}: ${rel} does not exist`);
    throw new VerbExit(1);
  }

  // Read every story from the files, not the DB: the check is the one
  // `pnpm validate` runs on main, so it has to see what main's files say.
  const { rfcs, stories } = loadAll(join(tasksDir, "rfcs"), { parseStory: () => true });
  const edges = new Map(
    stories.map((st) => [
      st.id,
      {
        deps: stringList(st.frontmatter?.deps),
        "deps-rfc": stringList(st.frontmatter?.["deps-rfc"]),
      },
    ]),
  );
  const own = edges.get(id) ?? { deps: [], "deps-rfc": [] };
  const from = own[key];
  const to = applyDepsEdit(from, edit);
  if (to.length === from.length && to.every((d, i) => d === from[i])) {
    console.log(`${id} ${key} already [${to.join(", ")}]`);
    return { from, to, committed: false };
  }
  edges.set(id, { ...own, [key]: to });

  // The pre-edit graph is acyclic (validate enforces it on main), so any cycle
  // this edit introduces passes through `id`: seeding the walk there is complete.
  const { refViolations, cycles } = checkDepGraph({
    storyIds: new Set(stories.map((st) => st.id)),
    rfcIds: new Set(rfcs.filter((r) => !r.error).map((r) => r.dir)),
    depsOf: (sid) => edges.get(sid)?.deps ?? [],
    depsRfcOf: (sid) => edges.get(sid)?.["deps-rfc"] ?? [],
    seeds: [id],
  });
  const failures = [
    ...refViolations.map(({ dep, kind }) => `  ${kind} "${dep}" does not exist`),
    ...cycles.map((c) => `  dep cycle detected: ${c.join(" → ")}`),
  ];
  if (failures.length > 0) {
    console.error(
      `error: ${id} ${key} = [${to.join(", ")}] would fail \`pnpm validate\` — nothing changed.\n\n` +
        failures.join("\n"),
    );
    throw new VerbExit(1);
  }

  setFrontmatterList(abs, key, to);
  console.log(`set ${id} ${key} = [${to.join(", ")}]`);
  if (opts.commit === false) return { from, to, committed: false };

  const git = (args: string[]): string =>
    execFileSync("git", args, { cwd: tasksDir, encoding: "utf8" }).trim();
  // Stage only the story file — never `git add -A` (see rehome).
  git(["add", "--", rel]);
  git(["commit", "-q", "-m", `${cmd}: ${id}`]);
  pushMain(git, `tasks ${cmd}`);
  // Ingest reads git, so it runs after the commit.
  await ingest();
  return { from, to, committed: true };
}
