/**
 * Tests for the verbatim-ported ranking and frontmatter modules.
 *
 * Extracted from the old CLI's scripts/cli.test.ts with the SAME fixtures and
 * the SAME assertions. Their job is to prove the port did not change behavior;
 * a diff here is a red flag, not a refactor opportunity.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  bestBundle,
  bundleScope,
  churnVerdict,
  claimable,
  comparePriority,
  crossRfcConvergences,
  effectivePriority,
  emptyBundleReason,
  formatChurnBanner,
  formatConvergences,
  formatEmptyBundle,
  formatTouchingCount,
  isDepResolved,
  listFiltered,
  nextBundle,
  priorityContext,
  remainingStoryCounts,
  rfcPriorityMap,
  storiesTouching,
  summarizeBundle,
  type Index,
  type RfcEntry,
  type StoryEntry,
} from "./ranking.js";
import { editFrontmatter, removeFrontmatterKey, setFrontmatterList } from "./frontmatter.js";


function story(over: Partial<StoryEntry>): StoryEntry {
  return {
    id: "x",
    rfc: "0001-r",
    title: null,
    status: "ready",
    cluster: "c1",
    story_paths: [],
    deps: [],
    deps_rfc: [],
    est_loc: 100,
    updated: null,
    pr: null,
    priority: null,
    claim: null,
    assignee: null,
    blocked_by: null,
    closed_reason: null,
    file_path: "0001-r/stories/x.md",
    ...over,
  };
}

function index(stories: StoryEntry[]): Index {
  return {
    generated_at: "now",
    rfcs: [
      {
        id: "0001-r",
        title: "R",
        status: "active",
        owner: "@x",
        packages: [],
        clusters: ["c1", "c2"],
        file_path: "0001-r/README.md",
      },
      {
        id: "0002-r",
        title: "R2",
        status: "closed",
        owner: "@x",
        packages: [],
        clusters: ["c3"],
        file_path: "0002-r/README.md",
      },
    ],
    stories,
  };
}

describe("claimable", () => {
  it("filters out non-ready, unmet story deps, and unmet rfc deps", () => {
    const idx = index([
      story({ id: "a", status: "ready" }),
      story({ id: "b", status: "draft" }),
      story({ id: "c", status: "ready", deps: ["b"] }),
      story({ id: "d", status: "ready", deps_rfc: ["0001-r"] }), // 0001-r is active, not closed
      story({ id: "e", status: "ready", deps_rfc: ["0002-r"] }), // 0002-r is closed → ok
    ]);
    expect(
      claimable(idx)
        .map((s) => s.id)
        .sort(),
    ).toEqual(["a", "e"]);
  });

  it("treats a closed dep as resolved (same as done)", () => {
    const idx = index([
      story({ id: "doneDep", status: "done" }),
      story({ id: "closedDep", status: "closed", closed_reason: '"superseded"' }),
      story({ id: "a", status: "ready", deps: ["doneDep"] }),
      story({ id: "b", status: "ready", deps: ["closedDep"] }),
      story({ id: "c", status: "ready", deps: ["closedDep", "doneDep"] }),
    ]);
    expect(
      claimable(idx)
        .map((s) => s.id)
        .sort(),
    ).toEqual(["a", "b", "c"]);
  });

  it("excludes ready stories whose own RFC is not active", () => {
    const idx = index([
      story({ id: "active", rfc: "0001-r" }), // 0001-r active → included
      story({ id: "draft", rfc: "0003-r" }), // draft RFC → excluded
      story({ id: "postponed", rfc: "0004-r" }), // postponed → excluded
      story({ id: "superseded", rfc: "0005-r" }), // superseded → excluded
      story({ id: "closed", rfc: "0002-r", cluster: "c3" }), // closed → excluded
    ]);
    idx.rfcs.push(
      {
        id: "0003-r",
        title: "R3",
        status: "draft",
        owner: "@x",
        packages: [],
        clusters: ["c1"],
        file_path: "0003-r/README.md",
      },
      {
        id: "0004-r",
        title: "R4",
        status: "postponed",
        owner: "@x",
        packages: [],
        clusters: ["c1"],
        file_path: "0004-r/README.md",
      },
      {
        id: "0005-r",
        title: "R5",
        status: "superseded",
        owner: "@x",
        packages: [],
        clusters: ["c1"],
        file_path: "0005-r/README.md",
      },
    );
    expect(claimable(idx).map((s) => s.id)).toEqual(["active"]);
  });

  it("never surfaces a story build-index downgraded under a postponed RFC", () => {
    // build-index.mjs (tasks repo) emits effective status: a `ready` story
    // under a non-active RFC arrives here as `draft` with the authored value
    // in raw_status. Pin that neither claimable() nor listFiltered's status
    // filter resurrects it as claimable from the raw value.
    const idx = index([
      story({ id: "active", rfc: "0001-r", raw_status: "ready" }),
      story({ id: "downgraded", rfc: "0004-r", status: "draft", raw_status: "ready" }),
    ]);
    idx.rfcs.push({
      id: "0004-r",
      title: "R4",
      status: "postponed",
      owner: "@x",
      packages: [],
      clusters: ["c1"],
      file_path: "0004-r/README.md",
    });
    expect(claimable(idx).map((s) => s.id)).toEqual(["active"]);
    expect(listFiltered(idx, { status: "ready" }).map((s) => s.id)).toEqual(["active"]);
  });

  it("excludes a ready story whose RFC is null-status or absent from the index", () => {
    const idx = index([
      story({ id: "active", rfc: "0001-r" }), // active → included
      story({ id: "nullStatus", rfc: "0006-r" }), // RFC present but status null → excluded
      story({ id: "danglingRfc", rfc: "0099-r" }), // rfc absent from index.rfcs → excluded
    ]);
    idx.rfcs.push({
      id: "0006-r",
      title: "R6",
      status: null,
      owner: "@x",
      packages: [],
      clusters: ["c1"],
      file_path: "0006-r/README.md",
    });
    expect(claimable(idx).map((s) => s.id)).toEqual(["active"]);
  });

  it("honors --rfc filter", () => {
    const idx = index([
      story({ id: "a", rfc: "0001-r" }),
      story({ id: "b", rfc: "0002-r", cluster: "c3" }),
    ]);
    expect(claimable(idx, { rfc: "0001-r" }).map((s) => s.id)).toEqual(["a"]);
  });

  it("orders by priority (lower N first), unprioritized last, ties stable", () => {
    const idx = index([
      story({ id: "none1" }),
      story({ id: "p5", priority: 5 }),
      story({ id: "none2" }),
      story({ id: "p1", priority: 1 }),
    ]);
    // p1 < p5 < the two unprioritized, which keep their index order.
    expect(claimable(idx).map((s) => s.id)).toEqual(["p1", "p5", "none1", "none2"]);
  });
});

describe("bestBundle (0/1 knapsack)", () => {
  it("picks the optimal subset, not just the greedy largest-first", () => {
    const items = [
      story({ id: "big", est_loc: 200 }),
      story({ id: "a", est_loc: 100 }),
      story({ id: "b", est_loc: 80 }),
      story({ id: "c", est_loc: 70 }),
    ];
    // Greedy desc would pick [200]; optimum is [100,80,70] = 250.
    const result = bestBundle(items, 250)
      .map((s) => s.id)
      .sort();
    expect(result).toEqual(["a", "b", "c"]);
  });

  it("returns [] for empty input or zero budget", () => {
    expect(bestBundle([], 100)).toEqual([]);
    expect(bestBundle([story({ id: "x", est_loc: 50 })], 0)).toEqual([]);
  });
});

describe("nextBundle", () => {
  it("picks the best-filling cluster", () => {
    const idx = index([
      story({ id: "a1", cluster: "c1", est_loc: 100 }),
      story({ id: "a2", cluster: "c1", est_loc: 100 }),
      story({ id: "b1", cluster: "c2", est_loc: 240 }),
    ]);
    const bundle = nextBundle(idx, { maxLoc: 250 });
    // c1 bundles 200, c2 bundles 240 → c2 wins
    expect(bundle.map((s) => s.id)).toEqual(["b1"]);
  });

  it("excludes stories with null est_loc", () => {
    const idx = index([story({ id: "a", est_loc: null }), story({ id: "b", est_loc: 50 })]);
    expect(nextBundle(idx, { maxLoc: 250 }).map((s) => s.id)).toEqual(["b"]);
  });

  it("leads with the highest-priority story, overriding cluster-LOC packing", () => {
    // c2 packs more LOC (240 > 200), but a1 carries a priority while the c2
    // stories don't — the prioritized story must be the head (the loop's pick).
    const idx = index([
      story({ id: "a1", cluster: "c1", est_loc: 100, priority: 3 }),
      story({ id: "a2", cluster: "c1", est_loc: 100 }),
      story({ id: "b1", cluster: "c2", est_loc: 240 }),
    ]);
    const bundle = nextBundle(idx, { maxLoc: 250 });
    expect(bundle[0].id).toBe("a1");
    // Fill comes from a1's own cluster within the remaining budget.
    expect(bundle.map((s) => s.id).sort()).toEqual(["a1", "a2"]);
  });

  it("leads with a prioritized story even when it has no est_loc", () => {
    // A prioritized story is an explicit "do this" — a missing estimate must
    // not exclude it the way it does for the unprioritized knapsack path.
    const idx = index([
      story({ id: "p", cluster: "c1", est_loc: null, priority: 1 }),
      story({ id: "f", cluster: "c1", est_loc: 80 }),
    ]);
    const bundle = nextBundle(idx, { maxLoc: 250 });
    expect(bundle[0].id).toBe("p");
    expect(bundle.map((s) => s.id)).toEqual(["p", "f"]);
  });

  it("leads with a prioritized story whose est_loc exceeds the budget, flagged as over-budget", () => {
    const idx = index([
      story({ id: "big", cluster: "c1", est_loc: 450, priority: 2 }),
      story({ id: "f", cluster: "c1", est_loc: 80 }),
    ]);
    const bundle = nextBundle(idx, { maxLoc: 250 });
    expect(bundle.map((s) => s.id)).toEqual(["big"]);
    expect(summarizeBundle(bundle, 250)).toEqual({ total: 450, leadExceedsBudget: true });
  });

  it("does not flag a bundle whose total fits the budget", () => {
    const idx = index([
      story({ id: "p", cluster: "c1", est_loc: null, priority: 1 }),
      story({ id: "f", cluster: "c1", est_loc: 80 }),
    ]);
    const bundle = nextBundle(idx, { maxLoc: 250 });
    expect(summarizeBundle(bundle, 250)).toEqual({ total: 80, leadExceedsBudget: false });
  });

  it("orders multiple prioritized stories by ascending priority (lower N first)", () => {
    const idx = index([
      story({ id: "lo", cluster: "c1", est_loc: 50, priority: 9 }),
      story({ id: "hi", cluster: "c1", est_loc: 50, priority: 1 }),
    ]);
    const bundle = nextBundle(idx, { maxLoc: 250 });
    expect(bundle.map((s) => s.id)).toEqual(["hi", "lo"]);
  });

  it("never mixes a real cluster named '_none' with unclustered stories", () => {
    // A story with cluster: null must stay separate from a story whose
    // cluster literally equals "_none" — bundles are same-cluster only.
    // Patch the parent RFC's clusters so the literal "_none" passes validation.
    const idx = index([
      story({ id: "u", cluster: null, est_loc: 100 }),
      story({ id: "n", cluster: "_none", est_loc: 100 }),
    ]);
    const bundle = nextBundle(idx, { maxLoc: 250 });
    // Both clusters tie at 100; either may win, but never both together.
    expect(bundle.length).toBe(1);
  });

  it("returns [] when the filters select no ready story", () => {
    const idx = index([story({ id: "a", cluster: "c1", est_loc: 100, priority: 1 })]);
    expect(nextBundle(idx, { maxLoc: 250, cluster: "nope" })).toEqual([]);
  });

  it("returns [] when in-scope stories exist but none fit the budget", () => {
    // No priorities anywhere, so the knapsack path runs and nothing packs:
    // one story has no estimate, the other is over budget.
    const idx = index([
      story({ id: "a", cluster: "c1", est_loc: null }),
      story({ id: "b", cluster: "c1", est_loc: 900 }),
    ]);
    expect(nextBundle(idx, { maxLoc: 250 })).toEqual([]);
  });

  it("never returns [] once any in-scope story is prioritized", () => {
    const idx = index([story({ id: "a", cluster: "c1", est_loc: 900, priority: 1 })]);
    expect(nextBundle(idx, { maxLoc: 250 }).map((s) => s.id)).toEqual(["a"]);
  });
});

describe("emptyBundleReason", () => {
  it("reports no-matching-stories when the filters select nothing", () => {
    const idx = index([story({ id: "a", cluster: "c1", est_loc: 100 })]);
    expect(emptyBundleReason(idx, { cluster: "nope" })).toBe("no-matching-stories");
  });

  it("reports none-within-budget when the selection is non-empty", () => {
    const idx = index([story({ id: "a", cluster: "c1", est_loc: 900 })]);
    expect(emptyBundleReason(idx, {})).toBe("none-within-budget");
  });
});

describe("formatEmptyBundle", () => {
  it("omits the LOC budget when nothing matched the filters", () => {
    expect(formatEmptyBundle("no-matching-stories", 250, { rfc: "0024-tasks-cli-coverage" })).toBe(
      "no ready stories matching rfc 0024-tasks-cli-coverage",
    );
  });

  it("names both filters when both are set", () => {
    expect(formatEmptyBundle("no-matching-stories", 250, { rfc: "0024", cluster: "c1" })).toBe(
      "no ready stories matching rfc 0024 + cluster c1",
    );
  });

  it("reports the budget when the selection was non-empty", () => {
    expect(formatEmptyBundle("none-within-budget", 250)).toBe("no ready stories within 250 LOC");
    expect(formatEmptyBundle("none-within-budget", 250, { cluster: "c1" })).toBe(
      "no ready stories matching cluster c1 within 250 LOC",
    );
  });
});

describe("listFiltered", () => {
  it("composes rfc + status + cluster filters", () => {
    const idx = index([
      story({ id: "a", rfc: "0001-r", status: "draft", cluster: "c1" }),
      story({ id: "b", rfc: "0001-r", status: "ready", cluster: "c1" }),
      story({ id: "c", rfc: "0001-r", status: "ready", cluster: "c2" }),
    ]);
    const rows = listFiltered(idx, { rfc: "0001-r", status: "ready", cluster: "c2" });
    expect(rows.map((s) => s.id)).toEqual(["c"]);
  });
});

describe("storiesTouching", () => {
  const paths = (over: Partial<StoryEntry> & { story_paths: string[] }) => story(over);

  it("prefers an exact path match over prefix and substring matches", () => {
    const idx = index([
      paths({ id: "exact", story_paths: ["packages/activerecord/src/relation.ts"] }),
      paths({ id: "prefix", story_paths: ["packages/activerecord/src/relation.ts/x.ts"] }),
      paths({ id: "substr", story_paths: ["a/packages/activerecord/src/relation.ts.bak"] }),
    ]);
    expect(storiesTouching(idx, "packages/activerecord/src/relation.ts").map((s) => s.id)).toEqual([
      "exact",
    ]);
  });

  it("matches a directory prefix when no exact path matches", () => {
    const idx = index([
      paths({ id: "a", story_paths: ["packages/activerecord/src/associations/builder.ts"] }),
      paths({ id: "b", story_paths: ["packages/activerecord/src/relation.ts"] }),
    ]);
    expect(
      storiesTouching(idx, "packages/activerecord/src/associations/").map((s) => s.id),
    ).toEqual(["a"]);
  });

  it("falls back to a substring match", () => {
    const idx = index([paths({ id: "a", story_paths: ["packages/arel/src/nodes/binary.ts"] })]);
    expect(storiesTouching(idx, "nodes/binary").map((s) => s.id)).toEqual(["a"]);
  });

  it("includes drafts and other open statuses but excludes done and closed", () => {
    const idx = index([
      paths({ id: "d", status: "draft", story_paths: ["a.ts"] }),
      paths({ id: "b", status: "blocked", story_paths: ["a.ts"] }),
      paths({ id: "done", status: "done", story_paths: ["a.ts"] }),
      paths({ id: "closed", status: "closed", story_paths: ["a.ts"] }),
    ]);
    expect(storiesTouching(idx, "a.ts").map((s) => s.id)).toEqual(["d", "b"]);
    expect(storiesTouching(idx, "a.ts", { all: true }).map((s) => s.id)).toEqual([
      "d",
      "b",
      "done",
      "closed",
    ]);
  });

  it("skips stories from an older index with no story_paths", () => {
    const stale = story({ id: "old" });
    delete (stale as { story_paths?: string[] }).story_paths;
    const idx = index([stale, paths({ id: "new", story_paths: ["a.ts"] })]);
    expect(storiesTouching(idx, "a.ts").map((s) => s.id)).toEqual(["new"]);
  });
});

describe("crossRfcConvergences", () => {
  it("keeps only paths whose open stories span two or more RFCs, most stories first", () => {
    const idx = index([
      story({ id: "a", rfc: "0001-r", story_paths: ["shared.ts", "solo.ts"] }),
      story({ id: "b", rfc: "0002-r", story_paths: ["shared.ts"] }),
      story({ id: "c", rfc: "0003-r", story_paths: ["shared.ts", "pair.ts"] }),
      story({ id: "d", rfc: "0004-r", story_paths: ["pair.ts"] }),
      story({ id: "e", rfc: "0001-r", story_paths: ["solo.ts"] }),
    ]);
    const rows = crossRfcConvergences(idx);
    expect(rows.map((r) => r.path)).toEqual(["shared.ts", "pair.ts"]);
    expect(rows[0].rfcs).toEqual(["0001-r", "0002-r", "0003-r"]);
    expect(rows[0].stories.map((s) => s.id)).toEqual(["a", "b", "c"]);
  });

  it("excludes done and closed stories unless --all", () => {
    const idx = index([
      story({ id: "a", rfc: "0001-r", status: "draft", story_paths: ["x.ts"] }),
      story({ id: "b", rfc: "0002-r", status: "done", story_paths: ["x.ts"] }),
    ]);
    expect(crossRfcConvergences(idx)).toEqual([]);
    expect(crossRfcConvergences(idx, { all: true }).map((r) => r.path)).toEqual(["x.ts"]);
  });

  it("applies --exclude-rfc before the two-RFC threshold", () => {
    const idx = index([
      story({ id: "a", rfc: "0023-junk", story_paths: ["x.ts", "y.ts"] }),
      story({ id: "b", rfc: "0002-r", story_paths: ["x.ts"] }),
      story({ id: "c", rfc: "0003-r", story_paths: ["y.ts"] }),
      story({ id: "d", rfc: "0004-r", story_paths: ["y.ts"] }),
    ]);
    expect(crossRfcConvergences(idx).map((r) => r.path)).toEqual(["y.ts", "x.ts"]);
    const kept = crossRfcConvergences(idx, { excludeRfc: "0023-junk" });
    expect(kept.map((r) => r.path)).toEqual(["y.ts"]);
    expect(kept[0].rfcs).toEqual(["0003-r", "0004-r"]);
  });

  it("counts a path cited twice by one story once", () => {
    const idx = index([
      story({ id: "a", rfc: "0001-r", story_paths: ["x.ts", "x.ts"] }),
      story({ id: "b", rfc: "0002-r", story_paths: ["x.ts"] }),
    ]);
    expect(crossRfcConvergences(idx)[0].stories.map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("skips stories from an older index with no story_paths", () => {
    const stale = story({ id: "old", rfc: "0009-r" });
    delete (stale as { story_paths?: string[] }).story_paths;
    const idx = index([stale, story({ id: "n", rfc: "0001-r", story_paths: ["x.ts"] })]);
    expect(crossRfcConvergences(idx)).toEqual([]);
  });
});

describe("formatConvergences", () => {
  it("says so when nothing converges", () => {
    expect(formatConvergences([])).toBe("no paths carry open stories from more than one RFC");
  });

  it("renders one line per path with its story count and RFCs", () => {
    const rows = crossRfcConvergences(
      index([
        story({ id: "a", rfc: "0001-r", story_paths: ["x.ts"] }),
        story({ id: "b", rfc: "0002-r", story_paths: ["x.ts"] }),
      ]),
    );
    expect(formatConvergences(rows)).toBe("x.ts — 2 stories across 0001-r, 0002-r");
  });
});

describe("churnVerdict", () => {
  it("splits at 12 and 2 commits", () => {
    expect(churnVerdict(12)).toBe("hot");
    expect(churnVerdict(11)).toBe("moderate");
    expect(churnVerdict(2)).toBe("moderate");
    expect(churnVerdict(1)).toBe("cold");
    expect(churnVerdict(0)).toBe("cold");
  });
});

describe("formatChurnBanner", () => {
  it("names the churn verdict and what it means, or says churn is unavailable", () => {
    expect(formatChurnBanner("a.ts", 14, "hot")).toBe(
      "a.ts — 14 commits/90d (hot — likely touched anyway)",
    );
    expect(formatChurnBanner("a.ts", 0, "cold")).toBe(
      "a.ts — 0 commits/90d (cold — rarely touched)",
    );
    expect(formatChurnBanner("a.ts", null, null)).toContain("churn unavailable");
  });
});

describe("formatTouchingCount", () => {
  it("states the no-match case rather than printing an empty table", () => {
    expect(formatTouchingCount(0, false)).toBe("no open stories cite this path");
    expect(formatTouchingCount(0, true)).toBe("no stories cite this path");
  });

  it("agrees in number and scopes the count to open stories by default", () => {
    expect(formatTouchingCount(1, false)).toBe("1 open story cites this path:");
    expect(formatTouchingCount(46, false)).toBe("46 open stories cite this path:");
    expect(formatTouchingCount(46, true)).toBe("46 stories cite this path:");
  });
});

describe("isDepResolved", () => {
  it("treats done and closed as resolved, everything else as open", () => {
    expect(isDepResolved("done")).toBe(true);
    expect(isDepResolved("closed")).toBe(true);
    expect(isDepResolved("ready")).toBe(false);
    expect(isDepResolved("blocked")).toBe(false);
    expect(isDepResolved(null)).toBe(false);
    expect(isDepResolved(undefined)).toBe(false);
  });
});

describe("editFrontmatter", () => {
  function writeStory(body: string): string {
    const dir = mkdtempSync(join(tmpdir(), "rfcs-cli-"));
    const file = join(dir, "story.md");
    writeFileSync(file, body);
    return file;
  }

  it("updates an existing scalar key in place", () => {
    const file = writeStory(`---\nstatus: ready\nclaim: null\n---\nbody\n`);
    editFrontmatter(file, { status: "claimed", claim: `"2026-01-01T00:00:00Z"` });
    const out = readFileSync(file, "utf8");
    expect(out).toContain(`status: claimed`);
    expect(out).toContain(`claim: "2026-01-01T00:00:00Z"`);
    expect(out).toContain(`body`);
  });

  it("appends a key that is not yet present (e.g. first-time priority)", () => {
    const file = writeStory(`---\nstatus: ready\n---\nbody\n`);
    editFrontmatter(file, { priority: "3" });
    expect(readFileSync(file, "utf8")).toContain(`priority: 3`);
  });

  it("refuses to edit a list-valued key", () => {
    const file = writeStory(`---\ndeps:\n  - a\n  - b\nstatus: ready\n---\nbody\n`);
    vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`exit ${code}`);
    }) as never);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => editFrontmatter(file, { deps: "[a, b, c]" })).toThrow(/exit 1/);
    expect(errSpy.mock.calls[0]?.[0]).toMatch(/refusing to edit list-valued/);
    // afterEach restores all mocks; no manual restore needed.
  });
});

describe("removeFrontmatterKey (priority --clear)", () => {
  function writeStory(body: string): string {
    const dir = mkdtempSync(join(tmpdir(), "rfcs-cli-"));
    const file = join(dir, "story.md");
    writeFileSync(file, body);
    return file;
  }

  it("deletes a scalar key, leaving the rest of the frontmatter intact", () => {
    const file = writeStory(`---\nstatus: ready\npriority: 3\nest_loc: 80\n---\nbody\n`);
    removeFrontmatterKey(file, "priority");
    const out = readFileSync(file, "utf8");
    expect(out).not.toContain("priority");
    expect(out).toContain("status: ready");
    expect(out).toContain("est_loc: 80");
    expect(out).toContain("body");
  });

  it("is a no-op when the key is already absent", () => {
    const body = `---\nstatus: ready\n---\nbody\n`;
    const file = writeStory(body);
    removeFrontmatterKey(file, "priority");
    expect(readFileSync(file, "utf8")).toBe(body);
  });

  it("refuses to remove a list-valued key", () => {
    const file = writeStory(`---\ndeps:\n  - a\n  - b\nstatus: ready\n---\nbody\n`);
    vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`exit ${code}`);
    }) as never);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => removeFrontmatterKey(file, "deps")).toThrow(/exit 1/);
    expect(errSpy.mock.calls[0]?.[0]).toMatch(/refusing to remove list-valued/);
  });
});

describe("setFrontmatterList", () => {
  function writeStory(body: string): string {
    const dir = mkdtempSync(join(tmpdir(), "rfcs-cli-"));
    const file = join(dir, "story.md");
    writeFileSync(file, body);
    return file;
  }

  // Mirror of rfcs/0000-template/stories/template-story.md frontmatter,
  // including the inline comment on `priority:`.
  const TEMPLATE = `---
title: "Short prose title"
status: draft
updated: 2026-06-04
rfc: "0000-your-slug"
cluster: cluster-name-1
packages: [] # optional subset of the parent RFC's packages; empty inherits the RFC's list
deps: []
deps-rfc: []
est-loc: null
priority: null # optional integer; LOWER = higher ready-queue priority (absent = unprioritized)
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Body text.
`;

  it("converts an inline empty list to a block list", () => {
    const file = writeStory(`---\ndeps: []\nstatus: ready\n---\nbody\n`);
    setFrontmatterList(file, "deps", ["a", "b"]);
    expect(readFileSync(file, "utf8")).toBe(`---\ndeps:\n  - a\n  - b\nstatus: ready\n---\nbody\n`);
  });

  it("converts a block list to an inline empty list", () => {
    const file = writeStory(`---\ndeps:\n  - a\n  - b\nstatus: ready\n---\nbody\n`);
    setFrontmatterList(file, "deps", []);
    expect(readFileSync(file, "utf8")).toBe(`---\ndeps: []\nstatus: ready\n---\nbody\n`);
  });

  it("replaces an inline flow list", () => {
    const file = writeStory(`---\ndeps: [a, b]\nstatus: ready\n---\nbody\n`);
    setFrontmatterList(file, "deps", ["c"]);
    expect(readFileSync(file, "utf8")).toBe(`---\ndeps:\n  - c\nstatus: ready\n---\nbody\n`);
  });

  it("inserts an absent key in its canonical position", () => {
    const file = writeStory(`---\nstatus: ready\ndeps: []\npr: null\n---\nbody\n`);
    setFrontmatterList(file, "deps-rfc", ["0024-x"]);
    expect(readFileSync(file, "utf8")).toBe(
      `---\nstatus: ready\ndeps: []\ndeps-rfc:\n  - 0024-x\npr: null\n---\nbody\n`,
    );
  });

  it("preserves all non-target lines, including inline comments, on round-trip", () => {
    const file = writeStory(TEMPLATE);
    setFrontmatterList(file, "deps", ["alpha", "beta"]);
    setFrontmatterList(file, "deps", []);
    expect(readFileSync(file, "utf8")).toBe(TEMPLATE);
  });

  it("appends an absent key with no canonical position at the end of the block", () => {
    // RFC-README keys like `clusters`/`packages` are not in the story key order;
    // they fall back to an end-of-block append.
    const file = writeStory(`---\ntitle: "R"\nstatus: active\n---\nbody\n`);
    setFrontmatterList(file, "clusters", ["c1", "c2"]);
    expect(readFileSync(file, "utf8")).toBe(
      `---\ntitle: "R"\nstatus: active\nclusters:\n  - c1\n  - c2\n---\nbody\n`,
    );
  });

  it("leaves a multi-line body untouched when replacing a key", () => {
    const file = writeStory(`---\ndeps: []\nstatus: ready\n---\n# Heading\n\nline one\nline two\n`);
    setFrontmatterList(file, "deps", ["a"]);
    expect(readFileSync(file, "utf8")).toBe(
      `---\ndeps:\n  - a\nstatus: ready\n---\n# Heading\n\nline one\nline two\n`,
    );
  });

  it("refuses a nested/multi-level structure", () => {
    const file = writeStory(`---\ndeps:\n  - name: a\n    version: 1\nstatus: ready\n---\nbody\n`);
    vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`exit ${code}`);
    }) as never);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => setFrontmatterList(file, "deps", ["x"])).toThrow(/exit 1/);
    expect(errSpy.mock.calls[0]?.[0]).toMatch(/refusing to set nested\/multi-level/);
  });
});
