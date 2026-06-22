---
title: "Remove or converge dead query-methods buildArel/buildJoins join path (latent left_outer dedup regression)"
status: in-progress
updated: 2026-06-22
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 40
pr: 3890
claim: "2026-06-22T15:32:00Z"
assignee: "remove-or-converge-dead-querymethods-join-build-path"
blocked-by: null
---

## Context

While fixing PR #3501 (left_outer_joins/joins dedup) in
`packages/activerecord/src/relation.ts` `_applyJoinsToManager`, found that
`packages/activerecord/src/relation/query-methods.ts` exports a parallel,
**unused** join-build path: `buildArel` → `buildJoins` → `buildJoinBuckets`
(query-methods.ts:2404, :2574, :2499). It has no callers outside the file and
no tests (`git grep buildArel/buildJoins/buildJoinBuckets` shows only internal
references). The active SQL path is `relation.ts` `_buildArel` →
`_applyJoinsToManager`.

This dead path still carries the **un-deduped** behavior the merged PR fixed
on the live path: it emits `_namedInnerJoins` as a standalone InnerJoin
JoinDependency (query-methods.ts:2623) separate from the stashed left-outer
JD, so `joins(:posts).left_outer_joins(:posts)` would emit both an INNER and a
LEFT OUTER JOIN there. A future caller wiring through `buildArel` would
silently reintroduce the regression.

## Acceptance criteria

- [ ] Either remove the dead `buildArel` / `buildJoins` / `buildJoinBuckets`
      exports from query-methods.ts (confirm no callers/tests first), OR
- [ ] converge them to the same stashed-left-join dedup as
      `_applyJoinsToManager` (fold left-outer JD into the inner JD's
      `joinConstraints` as a stashed join, Rails `build_join_buckets`).
- [ ] If removing, drop the now-unused `buildJoinBuckets`/`selectNamedJoins`
      helpers only if they have no other consumers.
