---
title: "ungrouped-count-having-dropped"
status: ready
updated: 2026-07-24
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up from #5184 (`grouped-calculation-having-dropped`), raised in review.

PR #5184 fixed the dropped HAVING on the grouped arms (`groupedAggregate`,
`groupedCompositeAssoc`) and on the ungrouped `singleAggregate`
(sum/average/minimum/maximum) via `applyHavingToManager`
(`packages/activerecord/src/relation/calculations.ts`).

`performCount` (same file, ~lines 780-1210) was left out: it is not one
manager but roughly eight — the DISTINCT-on-pk fan-out, the eager-load
subquery, the `from()` variants and the plain
`table.get(pk).count(true)` path at the end — none of which call
`manager.having(...)`. So `Account.having("count(*) > 1").count()`
(no `.group`) still drops the clause.

Rails has one path for all of these: `execute_simple_calculation` builds
`query_builder = relation.arel` (calculations.rb:475/485) and `build_arel`
emits `arel.having(having_clause.ast) unless having_clause.empty?` with no
GROUP BY guard (query_methods.rb:1756). `build_count_subquery` likewise
spawns from the relation, so the having clause rides into the subquery.

Threading the clause through every `performCount` manager site was out of
scope for #5184 (it would have roughly doubled that PR's diff and touched
the eager/DISTINCT count paths, which have their own fidelity stories).

## Acceptance criteria

- Ungrouped `count` emits HAVING from `_havingClause` on every `performCount`
  manager path, including the DISTINCT-on-pk fan-out and the count-subquery
  path (where Rails puts it in the inner query, per `build_count_subquery`).
- Regression test in `calculations.trails.test.ts` alongside the existing
  "ungrouped calculation HAVING" describe — Rails has no test for this, so it
  is a trails-only guard. Verify it fails on the pre-fix implementation.
- No behavior change when the having clause is empty.
