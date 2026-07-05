---
title: "joins(:cte) routes to INNER JOIN via build_with_join_node (currently raises Unknown node type: Symbol)"
status: ready
updated: 2026-07-05
rfc: "0027-join-dependency-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails routes a CTE-name symbol in `joins(...)` position to an **InnerJoin** via
`build_with_join_node(name, Arel::Nodes::InnerJoin)`
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1850-1856`,
`build_join_buckets`). trails does not: `selectNamedJoins`
(`packages/activerecord/src/relation/query-methods.ts:2665-2690`) partitions the
CTE symbol out into a `CTEJoin`, but the inner-join callers pass **no block**
(query-methods.ts:2612 and the live `_applyJoinsToManager` path in
`relation.ts`), so the `CTEJoin` is silently dropped or the raw Symbol reaches
the arel visitor and raises `Unknown node type: Symbol`.

Observed during PR #4553: `Post.with(cte).joins(cteSym)` (even embedded as a
`from(subquery)`) raises `Unknown node type: Symbol`, so the inner-join contrast
for CTE routing could not be tested. The existing WithTest "with joins" case
works around this by joining the CTE via a raw SQL string.

## Acceptance criteria

- `Post.with(cte: sub).joins(cteSym)` emits an INNER JOIN to the CTE
  (`INNER JOIN <cte> ON <cte>.<fk> = <table>.<pk>`), matching Rails.
- Wire the `CTEJoin`→`buildWithJoinNode(name, Nodes.InnerJoin)` block into the
  inner-join callers (both `buildJoinBuckets` at query-methods.ts:2612 and the
  live `_applyJoinsToManager` path), reusing `buildWithJoinNode`.
- Convert the WithTest "with joins" case from the raw-SQL-string workaround to
  the canonical `joins(cteSym)` form, mirroring Rails' `test_with_joins`.

## Out of scope

- Left-outer live-path routing (separate story).
