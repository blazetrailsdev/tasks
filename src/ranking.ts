/**
 * Ready-queue ranking and bundle packing.
 *
 * PORTED VERBATIM from the old CLI (scripts/cli.ts:111-183, 414-612). These are
 * pure functions over an in-memory Index — no git, no fs, no storage coupling —
 * which is exactly why they survived the rewrite unchanged. Keeping them
 * identical is what makes the equivalence gate hold BY CONSTRUCTION: same
 * functions over an equivalent index produce identical output, so the migration
 * cannot silently reorder anyone's work queue.
 *
 * The one deliberate rename: the old `ready()` is `claimable()` here. `Story`'s
 * `enum` generates a static `Story.ready()` meaning `status = 'ready'`, which is
 * a much weaker condition than this one (which also requires an active RFC and
 * every dep resolved). Conflating them would hand agents unclaimable stories.
 */
export type StoryStatus =
  "draft" | "ready" | "claimed" | "in-progress" | "done" | "blocked" | "closed";
export type RfcStatus = "draft" | "active" | "closed" | "postponed" | "superseded";
export const STORY_STATUSES: readonly StoryStatus[] = [
  "draft",
  "ready",
  "claimed",
  "in-progress",
  "done",
  "blocked",
  "closed",
];
export const RFC_STATUSES: readonly RfcStatus[] = [
  "draft",
  "active",
  "closed",
  "postponed",
  "superseded",
];

export interface RfcEntry {
  id: string;
  title: string | null;
  status: RfcStatus | null;
  owner: string | null;
  packages: string[];
  clusters: string[];
  priority?: number | null;
  file_path: string;
}
export interface StoryEntry {
  id: string;
  rfc: string;
  title: string | null;
  // The EFFECTIVE status: build-index.mjs downgrades `ready` to `draft` when
  // the parent RFC is not active (effectiveStoryStatus in validate-lib.mjs),
  // so no index.json consumer can surface such a story as claimable. The
  // ready() gate below re-checks the RFC status anyway — belt and suspenders.
  status: StoryStatus | null;
  // The authored frontmatter status, before the parent-RFC override. Optional:
  // absent from index.json files built before the override existed.
  raw_status?: string | null;
  cluster: string | null;
  packages?: string[];
  // The trails files this story's body cites, derived at index-build time by
  // extractStoryPaths (lib.mjs). Optional: absent from an index.json built
  // before the field existed.
  story_paths?: string[];
  deps: string[];
  deps_rfc: string[];
  est_loc: number | null;
  updated: string | null;
  pr: number | null;
  priority: number | null;
  claim: string | null;
  assignee: string | null;
  blocked_by: string | null;
  closed_reason: string | null;
  file_path: string;
}
export interface Index {
  generated_at: string;
  rfcs: RfcEntry[];
  stories: StoryEntry[];
}

// ──────────────────── index loading ────────────────────

export function isDepResolved(status: string | null | undefined): boolean {
  return status === "done" || status === "closed";
}

export function rfcPriorityMap(index: Index): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of index.rfcs) if (typeof r.priority === "number") m.set(r.id, r.priority);
  return m;
}

export function effectivePriority(s: StoryEntry, rfcPriority: ReadonlyMap<string, number>): number {
  return s.priority ?? rfcPriority.get(s.rfc) ?? Infinity;
}

export interface PriorityContext {
  rfcPriority: ReadonlyMap<string, number>;
  remaining: ReadonlyMap<string, number>;
}

export function remainingStoryCounts(index: Index): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of index.stories) {
    if (isDepResolved(s.status)) continue;
    m.set(s.rfc, (m.get(s.rfc) ?? 0) + 1);
  }
  return m;
}

export function priorityContext(index: Index): PriorityContext {
  return { rfcPriority: rfcPriorityMap(index), remaining: remainingStoryCounts(index) };
}

export function comparePriority(a: StoryEntry, b: StoryEntry, ctx: PriorityContext): number {
  const ea = effectivePriority(a, ctx.rfcPriority);
  const eb = effectivePriority(b, ctx.rfcPriority);
  if (ea !== eb) return ea < eb ? -1 : 1;
  const pa = ctx.rfcPriority.get(a.rfc);
  const pb = ctx.rfcPriority.get(b.rfc);
  if (pa === undefined || pa !== pb) return 0;
  const ra = ctx.remaining.get(a.rfc) ?? 0;
  const rb = ctx.remaining.get(b.rfc) ?? 0;
  return ra === rb ? 0 : ra - rb;
}

export function claimable(index: Index, opts: { rfc?: string } = {}): StoryEntry[] {
  const ctx = priorityContext(index);
  const rfcStatus = new Map(index.rfcs.map((r) => [r.id, r.status]));
  const storyStatus = new Map(index.stories.map((s) => [s.id, s.status]));
  return (
    index.stories
      .filter((s) => {
        if (s.status !== "ready") return false;
        // A story is only claimable if its OWN RFC is active. A `ready` story
        // under a draft/postponed/superseded RFC violates the lifecycle invariant
        // (README: draft-RFC stories "should not be claimed"); a `ready` story
        // under a closed RFC is almost certainly stale. Only active RFCs feed
        // pickup. Uses index.rfcs status already in scope — no extra fs reads.
        // A null status or an rfc absent from the index also fails this check and
        // is excluded — the conservative default: don't surface a story whose RFC
        // can't be confirmed active.
        if (rfcStatus.get(s.rfc) !== "active") return false;
        if (opts.rfc && s.rfc !== opts.rfc) return false;
        // A dep is satisfied when it is `done` OR `closed`: a closed story will
        // never ship, but it will also never block — treating it as resolved
        // (same as done) is what keeps a dependent from being stranded forever.
        if (s.deps.some((d) => !isDepResolved(storyStatus.get(d)))) return false;
        if (s.deps_rfc.some((d) => rfcStatus.get(d) !== "closed")) return false;
        return true;
      })
      // Order the ready queue by effective priority (lower N first), honoring
      // the `priority` frontmatter's documented contract ("ready-queue
      // priority"). Unprioritized stories sort last. Array.sort is stable, so
      // ties — including the all-unprioritized common case — keep index order,
      // leaving callers that don't set priority (and their tests) unaffected.
      // `next-bundle` re-derives its own ordering on top of this; the gain here
      // is that the `ready` command's output reflects priority too.
      .sort((a, b) => comparePriority(a, b, ctx))
  );
}

// 0/1 knapsack: max total est_loc within budget. N ≤ a few dozen in
// practice; O(N·budget) is trivially fast.
export function bestBundle(items: StoryEntry[], budget: number): StoryEntry[] {
  const n = items.length;
  if (n === 0 || budget <= 0) return [];
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(budget + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    const cost = items[i - 1].est_loc ?? 0;
    for (let b = 0; b <= budget; b++) {
      dp[i][b] = dp[i - 1][b];
      if (cost > 0 && cost <= b) {
        dp[i][b] = Math.max(dp[i][b], dp[i - 1][b - cost] + cost);
      }
    }
  }
  const chosen: StoryEntry[] = [];
  let b = budget;
  for (let i = n; i >= 1; i--) {
    if (dp[i][b] !== dp[i - 1][b]) {
      chosen.push(items[i - 1]);
      b -= items[i - 1].est_loc ?? 0;
    }
  }
  return chosen.reverse();
}

export function bundleScope(index: Index, opts: { cluster?: string; rfc?: string }): StoryEntry[] {
  return claimable(index, { rfc: opts.rfc }).filter((s) =>
    opts.cluster ? s.cluster === opts.cluster : true,
  );
}

export type EmptyBundleReason = "no-matching-stories" | "none-within-budget";

export function emptyBundleReason(
  index: Index,
  opts: { cluster?: string; rfc?: string },
): EmptyBundleReason {
  return bundleScope(index, opts).length === 0 ? "no-matching-stories" : "none-within-budget";
}

export function nextBundle(
  index: Index,
  opts: { maxLoc: number; cluster?: string; rfc?: string },
): StoryEntry[] {
  const inScope = bundleScope(index, opts);
  // Priority overrides cluster-LOC packing. The legend says "lower N = higher
  // priority"; honor it literally — any prioritized story outranks every
  // unprioritized one, regardless of cluster or how well it fills the budget.
  // The loop takes stories[0], so the head must be the globally-highest
  // priority candidate; we then fill the rest of the budget from that story's
  // cluster (so a prioritized cluster still bundles together). A prioritized
  // story is an explicit "do this" signal, so it leads even when it has no
  // est_loc (treated as 0 for the budget) — the missing-estimate exclusion
  // below is only for the unprioritized knapsack path. Absent any priorities
  // this branch is skipped and the original packing runs unchanged.
  //
  // `claimable()` already returns stories sorted by priority (lower N first), and
  // `.filter()` preserves order, so `prioritized[0]` is the highest-priority
  // candidate without re-sorting here — the ordering source of truth stays in
  // `ready()`.
  const ctx = priorityContext(index);
  const prioritized = inScope.filter((s) => effectivePriority(s, ctx.rfcPriority) !== Infinity);
  if (prioritized.length > 0) {
    const lead = prioritized[0];
    const leadLoc = lead.est_loc ?? 0;
    const rest = inScope.filter(
      (s) => s.id !== lead.id && s.cluster === lead.cluster && s.est_loc !== null,
    );
    const fill = bestBundle(rest, opts.maxLoc - leadLoc).sort((a, b) => comparePriority(a, b, ctx));
    return [lead, ...fill];
  }
  // Unprioritized path: knapsack same-cluster stories by est_loc, so stories
  // without an estimate can't be packed and are excluded here.
  const candidates = inScope.filter((s) => s.est_loc !== null);
  // Use Map<string | null, ...> so `null` (unclustered) stays distinct
  // from any real cluster name, even one literally called "_none".
  const byCluster = new Map<string | null, StoryEntry[]>();
  for (const s of candidates) {
    const bucket = byCluster.get(s.cluster) ?? [];
    bucket.push(s);
    byCluster.set(s.cluster, bucket);
  }
  let best: StoryEntry[] = [];
  let bestTotal = 0;
  for (const group of byCluster.values()) {
    const subset = bestBundle(group, opts.maxLoc);
    const total = subset.reduce((a, s) => a + (s.est_loc ?? 0), 0);
    if (total > bestTotal) {
      best = subset;
      bestTotal = total;
    }
  }
  return best;
}

export function summarizeBundle(
  rows: StoryEntry[],
  maxLoc: number,
): { total: number; leadExceedsBudget: boolean } {
  const total = rows.reduce((a, s) => a + (s.est_loc ?? 0), 0);
  return { total, leadExceedsBudget: total > maxLoc };
}

export function formatEmptyBundle(
  reason: EmptyBundleReason,
  maxLoc: number,
  filters: { cluster?: string; rfc?: string } = {},
): string {
  const named = [
    filters.rfc ? `rfc ${filters.rfc}` : null,
    filters.cluster ? `cluster ${filters.cluster}` : null,
  ].filter((p): p is string => p !== null);
  const scope = named.length ? ` matching ${named.join(" + ")}` : "";
  return reason === "no-matching-stories"
    ? `no ready stories${scope}`
    : `no ready stories${scope} within ${maxLoc} LOC`;
}

// ── list / touching / convergence / churn formatting (cli.ts:613-708, 729-789) ──
export function listFiltered(
  index: Index,
  opts: { rfc?: string; status?: string; cluster?: string } = {},
): StoryEntry[] {
  return index.stories.filter((s) => {
    if (opts.rfc && s.rfc !== opts.rfc) return false;
    if (opts.status && s.status !== opts.status) return false;
    if (opts.cluster && s.cluster !== opts.cluster) return false;
    return true;
  });
}

// ──────────────────── path lookup (`touching`) ────────────────────

// Statuses that mean "someone still intends to do this". Drafts count: most
// open stories are drafts, and a draft story is exactly the triage record
// `touching` exists to surface.
export const OPEN_STORY_STATUSES: readonly StoryStatus[] = [
  "draft",
  "ready",
  "claimed",
  "in-progress",
  "blocked",
];

// Stories whose body cites `query`, matched in tiers: an exact path hit wins,
// else a directory-prefix hit, else a substring hit. Only the first tier that
// matches anything is returned, so a precise query is never diluted by the
// loose fallbacks. Stories from an index built before `story_paths` existed
// have no paths to match and are skipped.
export function storiesTouching(
  index: Index,
  query: string,
  opts: { all?: boolean } = {},
): StoryEntry[] {
  const q = query.replace(/^\.\//, "");
  const dir = q.endsWith("/") ? q : `${q}/`;
  const scoped = index.stories.filter(
    (s) => opts.all || (s.status !== null && OPEN_STORY_STATUSES.includes(s.status)),
  );
  const tier = (match: (p: string) => boolean) =>
    scoped.filter((s) => (s.story_paths ?? []).some(match));
  const exact = tier((p) => p === q);
  if (exact.length) return exact;
  const prefixed = tier((p) => p.startsWith(dir));
  if (prefixed.length) return prefixed;
  return tier((p) => p.includes(q));
}

// One path whose open stories span more than one RFC: triage for this file has
// already split across epics, so whoever picks up either side is working half
// the file. `--exclude-rfc` drops an RFC's stories *before* the >=2 threshold is
// re-evaluated, so a path shared only by the excluded RFC and one other stops
// being a convergence rather than lingering as a one-RFC row. No slug is
// special-cased here: the catch-all epic is the caller's argument, not ours.
export interface CrossRfcConvergence {
  path: string;
  rfcs: string[];
  stories: StoryEntry[];
}

export function crossRfcConvergences(
  index: Index,
  opts: { all?: boolean; excludeRfc?: string } = {},
): CrossRfcConvergence[] {
  const byPath = new Map<string, StoryEntry[]>();
  for (const s of index.stories) {
    if (!opts.all && !(s.status !== null && OPEN_STORY_STATUSES.includes(s.status))) continue;
    if (opts.excludeRfc && s.rfc === opts.excludeRfc) continue;
    for (const path of new Set(s.story_paths ?? [])) {
      const bucket = byPath.get(path);
      if (bucket) bucket.push(s);
      else byPath.set(path, [s]);
    }
  }
  const rows: CrossRfcConvergence[] = [];
  for (const [path, stories] of byPath) {
    const rfcs = [...new Set(stories.map((s) => s.rfc))].sort();
    if (rfcs.length < 2) continue;
    rows.push({ path, rfcs, stories });
  }
  rows.sort((a, b) => b.stories.length - a.stories.length || a.path.localeCompare(b.path));
  return rows;
}

export function formatConvergences(rows: CrossRfcConvergence[]): string {
  if (rows.length === 0) return "no paths carry open stories from more than one RFC";
  return rows
    .map((r) => `${r.path} — ${r.stories.length} stories across ${r.rfcs.join(", ")}`)
    .join("\n");
}

// The trails checkout to measure churn in. Deliberately NOT derived from
// TASKS_DIR: the per-worktree `tasks` symlink resolves to a *sibling* tree
// under tasks-worktrees/, so its parent is not the trails repo. cwd is the
// reliable anchor — `pnpm tasks` runs from inside the trails worktree.

export type ChurnVerdict = "hot" | "moderate" | "cold";

export function churnVerdict(commits90d: number): ChurnVerdict {
  if (commits90d >= 12) return "hot";
  if (commits90d >= 2) return "moderate";
  return "cold";
}

// Commits in the last 90 days touching `path`, or null when git could not be
// asked at all. Null and 0 are deliberately distinct: 0 means "measured, and
// nothing touched it" (a genuine `cold`, which tells the caller to file a
// story), while a swallowed failure reported as 0 would fabricate that same
// verdict from no evidence. A path git simply doesn't know is a real 0.

// What each verdict means for the caller's actual decision: file a story, or
// note it as a driveby on work that is coming anyway.
const CHURN_GLOSS: Record<ChurnVerdict, string> = {
  hot: "likely touched anyway",
  moderate: "occasional edits",
  cold: "rarely touched",
};

export function formatChurnBanner(
  query: string,
  churn: number | null,
  verdict: ChurnVerdict | null,
): string {
  return churn === null || verdict === null
    ? `${query} — churn unavailable (no trails checkout resolved; pass --repo or set $TRAILS_DIR)`
    : `${query} — ${churn} commits/90d (${verdict} — ${CHURN_GLOSS[verdict]})`;
}

export function formatTouchingCount(count: number, all: boolean): string {
  const scope = all ? "" : "open ";
  if (count === 0) return `no ${scope}stories cite this path`;
  return `${count} ${scope}${count === 1 ? "story cites" : "stories cite"} this path:`;
}

// ──────────────────── mutations ────────────────────

// Today's date (UTC, YYYY-MM-DD) for the `updated:` frontmatter stamp. Every
// mutation that writes a story file stamps this so the backlog page can show
// staleness; build-index passes `updated` through to index.json verbatim, so
// the index stays deterministic (the wall-clock read happens here, at edit
// time, not at build time). Day granularity matches the day-level display.
