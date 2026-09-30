/**
 * Authoring: creating a story.
 *
 * Creation is a MARKDOWN act, not a database one. A new story is prose —
 * context, acceptance criteria, verification — and it goes through git so it can
 * be reviewed like any other writing. The row appears because `ingest` sees the
 * new file, which keeps ingest the single creator of rows.
 *
 * So `tasks new` writes a file, commits it, and runs ingest. It does NOT insert
 * a row directly. That is what lets `tasks new X` be followed immediately by
 * `tasks claim X` without giving authoring a second path into the database that
 * could disagree with the first.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { Rfc } from "./models/index.js";
import { resolveTasksDir } from "./db-path.js";
import { VerbExit } from "./db.js";
import { pushMain } from "./export.js";
import { appendFrontmatterListItems } from "./frontmatter.js";
// @ts-expect-error — ported JS module, no type declarations
import { loadAll as loadAllUntyped } from "../scripts/lib.mjs";
// @ts-expect-error — ported JS module, no type declarations
import { validateStoryFile as validateStoryFileUntyped } from "../scripts/validate-lib.mjs";
// @ts-expect-error — ported JS module, no type declarations
import { checkDepGraph as checkDepGraphUntyped } from "../scripts/validate-lib.mjs";
import type { StoryStatus } from "./models/index.js";

export interface LoadedRfc {
  dir: string;
  frontmatter: Record<string, unknown> | null;
  error?: string;
}
export interface LoadedStory {
  id: string;
  rfc: string;
  file: string;
  frontmatter?: Record<string, unknown> | null;
}
export const loadAll = loadAllUntyped as (
  rfcsRoot: string,
  opts: { parseStory: (file: string) => boolean },
) => { rfcs: LoadedRfc[]; stories: LoadedStory[]; unparsed: LoadedStory[] };
export const validateStoryFile = validateStoryFileUntyped as (args: {
  rfcs: LoadedRfc[];
  story: LoadedStory;
  others: LoadedStory[];
}) => { errors: string[] };
export const checkDepGraph = checkDepGraphUntyped as (args: {
  storyIds: Set<string>;
  rfcIds: Set<string>;
  depsOf: (id: string) => string[];
  depsRfcOf?: (id: string) => string[];
  seeds: Iterable<string>;
}) => {
  refViolations: { from: string; dep: string; kind: "dep" | "deps-rfc" }[];
  cycles: string[][];
};

/** Escape for a YAML double-quoted scalar: backslash first, then quote. */
const MARKDOWNLINT = join(import.meta.dirname, "..", "node_modules", ".bin", "markdownlint-cli2");

const qs = (s: string): string => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

export interface NewStoryOpts {
  title?: string;
  status?: StoryStatus;
  cluster?: string | null;
  packages?: string[];
  estLoc?: number | null;
  deps?: string[];
  priority?: number | null;
  body?: string;
  date: string;
}

/**
 * Does `body` say nothing — absent, empty, or only headings? A title-only stub
 * is a story someone has to re-derive from scratch later, and every stray
 * `x.md` on main was one: the template's four empty headings and nothing else.
 */
export function isEmptyBody(body: string | undefined): boolean {
  return (body ?? "").split("\n").every((line) => line.trim() === "" || /^#{1,6}\s/.test(line));
}

/**
 * Render a story file.
 *
 * Ported from the old CLI's buildStoryContent so new files are identical in
 * shape to the 7,220 already in the tree — same key order, same quoting, same
 * `null` spellings. Anything else shows up as churn the first time prettier or
 * an export touches the file.
 */
export function buildStoryContent(rfcSlug: string, storySlug: string, opts: NewStoryOpts): string {
  const title = opts.title ?? storySlug;
  const deps = opts.deps ?? [];
  const depsYaml = deps.length === 0 ? "[]" : `[${deps.map(qs).join(", ")}]`;
  const packages = opts.packages ?? [];
  const packagesYaml = packages.length === 0 ? "[]" : `[${packages.map(qs).join(", ")}]`;
  const body =
    opts.body != null
      ? `\n${opts.body.replace(/^\n+/, "").replace(/\n+$/, "")}\n`
      : "\n## Context\n\n## Acceptance criteria\n\n## Definition of done\n\n## Verification\n";

  return `---
title: ${qs(title)}
status: ${opts.status ?? "draft"}
updated: ${opts.date}
rfc: ${qs(rfcSlug)}
cluster: ${opts.cluster != null ? opts.cluster : "null"}
packages: ${packagesYaml}
deps: ${depsYaml}
deps-rfc: []
est-loc: ${opts.estLoc != null ? opts.estLoc : "null"}
priority: ${opts.priority != null ? opts.priority : "null"}
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---
${body}`;
}

export interface NewStoryResult {
  path: string;
  committed: boolean;
}

/**
 * Catch a bad-markdown body HERE, at authoring time, not on main's CI. This is
 * the same `.markdownlint-cli2.jsonc` config `pnpm lint` runs against the
 * whole repo, scoped to just the file just written so `tasks new` stays fast.
 * A bare-``` fence (MD040) or a `#NNNN` PR reference misread as a heading
 * (MD018) is exactly the recurring pattern that reds `pnpm lint` on main —
 * reject it before it is committed, rather than baselining or disabling the
 * rule once main is already red.
 *
 * `abs` is deleted and a `VerbExit` thrown on failure — the story either
 * lands clean or not at all, matching every other guard in `newStory`.
 */
export function assertMarkdownlintClean(abs: string, rel: string, cwd: string): void {
  try {
    // The binary comes from this CLI's own install, not `cwd`: a scratch
    // worktree has the repo's lint config but no node_modules.
    execFileSync(MARKDOWNLINT, [abs], { cwd, encoding: "utf8" });
  } catch (e) {
    rmSync(abs);
    const out = [(e as { stdout?: string }).stdout, (e as { stderr?: string }).stderr]
      .filter(Boolean)
      .join("\n");
    console.error(`error: ${rel} fails markdownlint — story not written.\n\n${out}`);
    throw new VerbExit(1);
  }
}

/**
 * `pnpm validate`'s story rules, run against the file just written — the same
 * `validateStoryFile` that shares its rules with the whole-tree validate(), so
 * this guard cannot drift from CI. Every `new:` commit that turned main red
 * failed one of them: a duplicate `x` slug, a `--packages` entry the RFC does
 * not declare. Same contract as assertMarkdownlintClean: `abs` is deleted and a
 * `VerbExit` thrown on failure.
 *
 * Only `abs` is parsed. Every other story file is listed, not read, which is
 * all the duplicate-id and dep-reference checks need.
 */
export function assertValidateClean(abs: string, rel: string, cwd: string): void {
  const { rfcs, stories, unparsed } = loadAll(join(cwd, "rfcs"), {
    parseStory: (file: string) => file === abs,
  });
  const [story] = stories;
  const { errors } = story
    ? validateStoryFile({ rfcs, story, others: unparsed })
    : { errors: [`not a story file validate would load`] };
  if (errors.length === 0) return;
  rmSync(abs);
  console.error(
    `error: ${rel} fails \`pnpm validate\` — story not written.\n\n` +
      errors.map((e) => `  ${e}`).join("\n"),
  );
  throw new VerbExit(1);
}

/**
 * A slug is a story's permanent id and its filename. `x`, `zz` and `t` all
 * reached main as stories — seven `x.md` alone, each a duplicate id that reds
 * `pnpm validate` — and every real slug in the tree is kebab-case of at least
 * two words, so a slug that is not is a typo, not a story.
 */
export const STORY_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)+$/;

/**
 * Declare the story's `--packages` / `--cluster` on its RFC README when the RFC
 * does not yet, rather than refuse. Both lists are markdown-owned, so widening
 * them is ordinary authoring and lands in the same commit as the story;
 * refusing would only push agents back to hand-authoring the file.
 *
 * Only a name some RFC already declares is widened: that is the repo's own
 * package and cluster vocabulary, versioned with it. Anything else is a typo
 * until proven otherwise, and is refused. Returns the README path when it
 * changed.
 */
export function widenRfcDeclarations(
  dir: string,
  rfcSlug: string,
  wanted: { packages: string[]; cluster: string | null },
): string | null {
  const { rfcs } = loadAll(join(dir, "rfcs"), { parseStory: () => false });
  const widening = planRfcWidening(rfcs, rfcSlug, {
    packages: wanted.packages,
    clusters: wanted.cluster != null ? [wanted.cluster] : [],
  });
  return applyRfcWidening(dir, rfcSlug, widening);
}

export interface RfcWidening {
  packages: string[];
  clusters: string[];
}

/** The string items of a frontmatter list, or none when it is not a list. */
export const stringList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

/**
 * The names `wanted` adds to `rfcSlug`'s README, with nothing written yet —
 * `tasks rehome` validates the moved stories against the widened lists before
 * it touches the tree. Refuses (`VerbExit`) a name no RFC declares.
 */
export function planRfcWidening(
  rfcs: LoadedRfc[],
  rfcSlug: string,
  wanted: RfcWidening,
): RfcWidening {
  const rfc = rfcs.find((r) => r.dir === rfcSlug);
  // An unparseable README is not ours to rewrite; assertValidateClean reports it.
  if (!rfc || rfc.error || rfc.frontmatter == null) return { packages: [], clusters: [] };
  const missing = (key: keyof RfcWidening, names: string[]) => {
    const declared = stringList(rfc.frontmatter?.[key]);
    const known = new Set(rfcs.flatMap((r) => stringList(r.frontmatter?.[key])));
    const absent = [...new Set(names)].filter((n) => !declared.includes(n));
    const unknown = absent.filter((n) => !known.has(n));
    if (unknown.length > 0) {
      console.error(
        `error: ${key === "packages" ? "package" : "cluster"} ${unknown.map((n) => `"${n}"`).join(", ")} not declared by ${rfcSlug}, nor by any\n` +
          `  other RFC — not a known name, so not widened onto the RFC. Check the spelling;\n` +
          `  a genuinely new one is declared on rfcs/${rfcSlug}/README.md first.`,
      );
      throw new VerbExit(1);
    }
    return absent;
  };
  return {
    packages: missing("packages", wanted.packages),
    clusters: missing("clusters", wanted.clusters),
  };
}

/** Write a planned widening onto the README. Returns its path when it changed. */
export function applyRfcWidening(dir: string, rfcSlug: string, w: RfcWidening): string | null {
  if (w.packages.length === 0 && w.clusters.length === 0) return null;
  const readme = join("rfcs", rfcSlug, "README.md");
  for (const key of ["packages", "clusters"] as const) {
    appendFrontmatterListItems(join(dir, readme), key, w[key]);
    if (w[key].length > 0) console.log(`declared ${key} ${w[key].join(", ")} on ${readme}`);
  }
  return readme;
}

/**
 * Create a story: write the file, commit it, and let ingest create the row.
 *
 * `status` defaults to draft. `ready` is honored only when the parent RFC is
 * active — otherwise a new story under a draft RFC would be immediately
 * claimable, which the lifecycle forbids and the ready queue would filter out
 * anyway.
 */
export async function newStory(
  rfcSlug: string,
  storySlug: string,
  opts: Partial<Omit<NewStoryOpts, "date">> & { commit?: boolean; allowEmpty?: boolean } = {},
): Promise<NewStoryResult> {
  if (!STORY_SLUG_RE.test(storySlug)) {
    console.error(
      `error: "${storySlug}" is not a story slug — a slug is kebab-case of at least two\n` +
        `  words (e.g. relation-or-drops-bind-params). Check the arguments: tasks new <rfc> <slug>.`,
    );
    throw new VerbExit(1);
  }
  if (!opts.allowEmpty && isEmptyBody(opts.body)) {
    console.error(
      `error: "${storySlug}" has no body — pass --body-file with a ## Context (the file:line\n` +
        `  you are looking at) and at least one ## Acceptance criteria bullet. A heading-only\n` +
        `  stub is re-derived from scratch by whoever picks it up; --allow-empty overrides.`,
    );
    throw new VerbExit(1);
  }

  const rfc = await Rfc.findBy({ id: rfcSlug });
  if (!rfc) {
    console.error(`error: no such RFC "${rfcSlug}"`);
    throw new VerbExit(1);
  }

  // A terminal RFC cannot take new work. validate() rejects a closed RFC that
  // holds an unfinished story, so filing one here does not just look odd — it
  // turns main's CI red for everyone. This happened: post-merge-findings picked
  // a "best-fit" RFC that had already been auto-closed, and the resulting draft
  // story broke validate on main.
  //
  // Reopen the RFC first if the work genuinely belongs to it, or pick another.
  if (rfc.status === "closed" || rfc.status === "superseded") {
    console.error(
      `error: RFC ${rfcSlug} is ${rfc.status} — it cannot take new stories.\n` +
        `  A ${rfc.status} RFC holding an unfinished story fails \`pnpm validate\`, which is a\n` +
        `  CI failure on main. Reopen it if this work belongs there, or file under\n` +
        `  another active RFC (0023-surfaced-deviations is the catch-all).`,
    );
    throw new VerbExit(1);
  }

  const status: StoryStatus = opts.status ?? "draft";
  if (status === "ready" && rfc.status !== "active") {
    console.error(
      `error: cannot create "${storySlug}" as ready — RFC ${rfcSlug} is ${rfc.status}, not active`,
    );
    throw new VerbExit(1);
  }

  const rel = join("rfcs", rfcSlug, "stories", `${storySlug}.md`);
  const content = buildStoryContent(rfcSlug, storySlug, {
    ...opts,
    status,
    date: new Date().toISOString().slice(0, 10),
  });

  // Author against origin/main in a throwaway worktree, never the caller's
  // worktree and never the main checkout's.
  //
  // Workers run `tasks new` from a feature worktree to file findings after
  // their PR merges. Committing there strands the story on a branch that has
  // already merged. The fix used to be "write into the main checkout, and
  // refuse unless it is on main" — but the main checkout is just another
  // working tree, and whenever someone had it on a branch every agent's
  // `tasks new` failed, and they fell back to hand-authoring story files.
  // A detached scratch worktree at origin/main needs nobody's checkout.
  return withMainScratch((dir) => {
    const abs = join(dir, rel);
    if (existsSync(abs)) {
      console.error(`error: ${rel} already exists`);
      throw new VerbExit(1);
    }
    const readme = widenRfcDeclarations(dir, rfcSlug, {
      packages: opts.packages ?? [],
      cluster: opts.cluster ?? null,
    });
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
    assertMarkdownlintClean(abs, rel, dir);
    assertValidateClean(abs, rel, dir);

    if (opts.commit === false) {
      // Nothing to land; hand back a copy the caller can inspect, since the
      // scratch tree is about to be removed.
      console.log(content);
      return { path: rel, committed: false };
    }
    const git = (args: string[]): string =>
      execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
    git(["add", "--", rel, ...(readme ? [readme] : [])]);
    git(["commit", "-q", "-m", `new: ${rfcSlug}/${storySlug}`]);
    // Push, or the story exists only in a worktree that is about to vanish.
    pushMain(git, "tasks new");
    return { path: rel, committed: true };
  });
}

/**
 * Run `fn` in a temporary detached worktree of the tasks clone at origin/main,
 * then remove it. Its commits survive as long as `fn` pushed them.
 */
export function withMainScratch<T>(fn: (dir: string) => T): T {
  const repo = resolveTasksDir();
  const git = (args: string[]): string =>
    execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  try {
    git(["fetch", "--quiet", "origin", "main"]);
  } catch (e) {
    console.error(`warning: could not fetch origin/main: ${(e as Error).message}`);
  }
  const base = hasRef(git, "origin/main") ? "origin/main" : "main";
  const dir = mkdtempSync(join(tmpdir(), "tasks-new-"));
  git(["worktree", "add", "--quiet", "--detach", dir, base]);
  // The tracked pre-commit hook fails closed without node_modules/.bin/lint-staged,
  // and a fresh worktree has none — so every `tasks new` commit was refused.
  const modules = join(repo, "node_modules");
  if (existsSync(modules)) symlinkSync(modules, join(dir, "node_modules"), "dir");
  try {
    return fn(dir);
  } finally {
    try {
      git(["worktree", "remove", "--force", dir]);
    } catch {
      rmSync(dir, { recursive: true, force: true });
      git(["worktree", "prune"]);
    }
  }
}

function hasRef(git: (args: string[]) => string, ref: string): boolean {
  try {
    git(["rev-parse", "--verify", "--quiet", ref]);
    return true;
  } catch {
    return false;
  }
}
