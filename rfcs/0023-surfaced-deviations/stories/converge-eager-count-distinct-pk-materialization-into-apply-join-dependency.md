---
title: "Converge performCount's inline distinct_relation_for_primary_key into applyJoinDependency"
status: done
updated: 2026-08-12
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6434
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5756 routed calculations' eager paths through `Relation#applyJoinDependency`
(Rails `calculate` -> `apply_join_dependency`,
`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:217-238`).

Three arms follow Rails' `apply_join_dependency(eager_loading: group_values.empty?)`
formula (`finder_methods.rb:457`), but `performCount`'s eager arms
(`packages/activerecord/src/relation/calculations.ts`, the `eagerJoined` closure
and every manager below it) deliberately pass `eagerLoading: false` where the
Rails formula gives `true`. They do so because they implement
`distinct_relation_for_primary_key` (`finder_methods.rb:463`,
`schema_statements.rb:1429-1452`) inline — materializing the limited DISTINCT
primary keys with their own `Ids` query and re-counting over `pk IN (ids)` — and
must not trip `applyJoinDependency`'s own limit/offset guard
(`relation.ts:4871-4881`), which throws `NotImplementedError` for that same case
because the SYNCHRONOUS predicate builder cannot execute the id query.

In Rails there is exactly one implementation of that materialization, inside
`apply_join_dependency`. trails has two: the throw in `applyJoinDependency` and
the async inline version in `performCount` (single-pk and composite-pk
branches). Converging them means giving `applyJoinDependency` an async path that
performs `distinct_relation_for_primary_key` itself, after which `performCount`
can pass the Rails `group_values.empty?` value and drop its own id-materialization
blocks. This is adjacent to the existing
`relation-handler-distinct-pk-materialization` continuation story, which covers
the predicate-builder side of the same gap.

## Acceptance criteria

- `distinct_relation_for_primary_key` exists in ONE place, reachable from
  `applyJoinDependency`, rather than being reimplemented in `performCount`.
- `performCount`'s eager arms pass Rails' `eager_loading: group_values.empty?`
  value instead of hardcoding `false`.
- `calculations.test.ts` and
  `relation/cpk-eager-count-aggregate-build-joins-fold.trails.test.ts` pass
  unchanged (no test renames).
