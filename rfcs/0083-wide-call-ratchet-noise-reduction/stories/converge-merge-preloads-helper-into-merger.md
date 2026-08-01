---
title: "Inline merge-preloads.ts folders into Merger so the wide gate sees the calls"
status: done
updated: 2026-08-01
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 5778
claim: "2026-08-01T00:40:41Z"
assignee: "converge-merge-preloads-helper-into-merger"
blocked-by: null
closed-reason: null
---

## Context

PR #5766 (`converge-merge-joins-helper-onto-joins-bang`) established that the wide
call gate is **same-file only** — it does not follow `merger.ts` into a helper
module. Collapsing `relation/merge-joins.ts` back into `Merger#mergeJoins` /
`#mergeOuterJoins` converged 8 wide-exclude entries at once (`joins!`,
`left_outer_joins!`, `construct_join_dependency` x2, `joins_values`,
`left_outer_joins_values`, `model` x2) and dropped the unreviewed mark 2845 -> 2840.

`Merger#mergeEagerLoad` / `#mergePreloads`
(`packages/activerecord/src/relation/merger.ts:90-96`) are the same shape: thin
wrappers over `foldMergeEagerLoad` / `foldMergePreloads` in
`relation/merge-preloads.ts`. Rails' `merge_preloads` is inline at
`vendor/rails/activerecord/lib/active_record/relation/merger.rb:96-115`. Seven
`merger.json` wide-exclude entries are held open purely by that split
(`find`, `includes!`, `includes_values`, `model`, `preload!`, `preload_values`,
`reflect_on_all_associations`), each with a reason that explicitly says the call
is satisfied inside the helper.

## Acceptance criteria

- `foldMergeEagerLoad` / `foldMergePreloads` are inlined into
  `Merger#mergeEagerLoad` / `#mergePreloads` (mirroring merger.rb's inline
  `merge_preloads`), and `relation/merge-preloads.ts` is deleted if it has no
  other callers.
- The wide-exclude entries that become real are deleted from
  `scripts/api-compare/call-mismatches-wide-exclude/activerecord/relation/merger.json`,
  and `call-mismatches-wide-unreviewed.json` is ratcheted down by the count that
  converges.
- `relation/merging.test.ts` and `associations/eager.test.ts` pass unchanged
  (no test renames).
