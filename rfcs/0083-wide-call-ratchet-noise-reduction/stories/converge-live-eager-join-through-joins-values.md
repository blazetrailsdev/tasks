---
title: "Fold live-path eager loading through joins_values instead of _buildEagerJoinManager"
status: done
updated: 2026-08-02
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 5909
claim: "2026-08-02T18:49:25Z"
assignee: "converge-live-eager-join-through-joins-values"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `_applyJoinsToManager`'s raw-join routing (#5902).

Rails has exactly one eager-join path: `apply_join_dependency` pushes the eager
`JoinDependency` into `joins_values`
(`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:457-461`),
and `build_join_buckets` pops it as `stashed_eager_load`
(`query_methods.rb:1847-1850`) and folds it into the single
`construct_join_dependency(named_joins, join_type).join_constraints(stashed_joins, …)`
call (`query_methods.rb:1893-1897`).

trails' live path (`Relation#_applyJoinsToManager`,
`packages/activerecord/src/relation.ts`) still has a SECOND path:
`_buildEagerJoinManager` pre-emits the eager LEFT OUTER JOINs, so
`_eagerLoadAssociations` never reaches `joins_values`. That forces a bespoke
compensation right in the middle of the converged `build_join_buckets` port —
the `eagerCovered` / `pendingLeftOuter` filter, which drops any
`left_outer_joins` value already covered by `_eagerLoadAssociations` or by
`includes().references()` promotion, because re-emitting it would duplicate
JOINs or raise ambiguous-column errors. Rails has no equivalent filter: the
`walk` fold in `join_constraints` dedups instead.

The subquery half (`buildJoinBuckets`, `relation/query-methods.ts`) already
folds eager as a stashed JD and has no such filter, so the two halves of the
`build_joins` split still diverge on eager handling even after #5902 converged
their raw-join routing.

`_withEagerJoinDependency` (relation.ts) already exists and does exactly Rails'
`joins!(construct_join_dependency(...))` for the SELECT/calculation paths — the
work is routing the live `toSql`/`toArel` path through it too and deleting
`_buildEagerJoinManager` plus the `eagerCovered` filter.

## Acceptance criteria

- The live path folds eager loading through `joins_values` as a stashed
  JoinDependency, exactly as Rails `apply_join_dependency` /
  `build_join_buckets` do — no separate `_buildEagerJoinManager` emission.
- The `eagerCovered` / `pendingLeftOuter` exclusion filter in
  `_applyJoinsToManager` is deleted; `joins(:x).eagerLoad(:x)` and
  `includes(:x).references(:x).leftOuterJoins(:x)` dedup via the JD `walk` fold
  instead.
- `pureLeftOuter` needs no eager term (it already has none after #5902) and
  stays correct once the eager JD lands in `joins_values`.
- Live and `from(relation)` subquery paths emit identical SQL for eager +
  left-outer + raw-join combinations; extend
  `relation/build-joins-from-subquery-dedup.test.ts` (no test renames).
- If this exceeds 500 LOC, split rather than shipping a partial merge.
