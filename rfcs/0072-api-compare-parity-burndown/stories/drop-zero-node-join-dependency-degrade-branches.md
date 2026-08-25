---
title: "Prove the three jd.nodes.length === 0 eager-degrade branches dead, then delete them"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5996
claim: "2026-08-03T17:33:42Z"
assignee: "drop-zero-node-join-dependency-degrade-branches"
blocked-by: null
closed-reason: null
---

## Context

Three eager-load call sites in `packages/activerecord/src/relation.ts` branch on
`jd.nodes.length === 0` and degrade to the plain base relation:

- `_executeEagerLoad` (the `// Nothing to JOIN (empty spec)` arm, which now
  just `selectAll`s the base rows).
- The `pluck` eager path (`return rel.pluck(...columns)`).
- The `cacheVersion` eager path (`collection = rel`).

These were load-bearing while the preload-fallback lane existed: a JD whose
every spec had been rolled back into `fallbackAssocs` had zero nodes, so the
branch fired and the caller preloaded instead. PR #5968 deleted the lane, so a
spec that can't be JOINed raises and the JD always ends up with a node per
resolved segment. The branch is now reachable only if the eager spec list is
empty — but each of the three sites is guarded upstream
(`_hasInclude` / `_eagerLoadingForSql()` / `_executeEagerLoad`'s callers only
run with a non-empty union of `_eagerLoadAssociations` and
`_includesAssociations`), so it looks unreachable.

Rails has no analogue: `apply_join_dependency`
(`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:457`)
and `construct_join_dependency` never test the node count, because there is
never a JD with zero nodes for a non-empty eager spec set.

## Acceptance criteria

- Establish whether an empty-but-truthy eager spec (e.g. `eagerLoad({})`,
  `eagerLoad([])`, `includes([])`) can reach any of the three sites with a
  zero-node JD. `JoinDependency.makeTree` on such a spec is the thing to check.
- If it can, keep exactly one branch and route the other sites through it,
  documenting the shape that reaches it with a test.
- If it cannot, delete all three branches so the eager paths have a single
  Rails-shaped flow.
- No change to emitted SQL for any spec that already joins, and no change to
  the `_eagerLoadBypassesJoinDependency` fast path, which is a separate
  (still-live) degrade route.
