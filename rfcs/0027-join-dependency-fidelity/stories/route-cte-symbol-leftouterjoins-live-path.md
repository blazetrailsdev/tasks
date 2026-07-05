---
title: "leftOuterJoins(:cte) routes to LEFT OUTER JOIN on the live _applyJoinsToManager path, not only from-subquery"
status: claimed
updated: 2026-07-05
rfc: "0027-join-dependency-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 2
pr: null
claim: "2026-07-05T20:21:53Z"
assignee: "route-cte-symbol-leftouterjoins-live-path"
blocked-by: null
closed-reason: null
---

## Context

`buildJoinBuckets` (`packages/activerecord/src/relation/query-methods.ts:2761-2777`)
partitions a CTE-name Symbol out of `leftOuterJoins` into a `CTEJoin` and routes
it to `buildWithJoinNode(name, Nodes.OuterJoin)`, mirroring Rails'
`build_join_buckets` block (`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1830-1836`).
But `buildJoinBuckets` is only reached on the subquery `from(relation)` path.

The **live** `toSql`/load path is `Relation#_applyJoinsToManager`
(`packages/activerecord/src/relation.ts:3594-3605`): it feeds
`_leftOuterJoinsValues` straight into `constructJoinDependency` with **no**
`selectNamedJoins` CTE partition. So a CTE symbol in `leftOuterJoins` position
raises `Invalid association spec` (query-methods.ts:1606) instead of emitting a
LEFT OUTER JOIN.

Coverage for the OuterJoin routing (PR #4553,
`with.test.ts` "with left joins routes a cte symbol to a left outer join") had
to be written through a `from(subquery)` embedding precisely because the direct
`Post.with(cte).leftOuterJoins(cteSym).toSql()` does not work. Rails' live
`left_outer_joins(:cte_name)` DOES emit the LEFT OUTER JOIN.

## Acceptance criteria

- `Post.with(cte: sub).leftOuterJoins(cteSym).toSql()` emits
  `LEFT OUTER JOIN <cte> ON <cte>.<fk> = <table>.<pk>` directly (no
  `from(subquery)` wrapper needed), matching Rails.
- Route the CTE partition through `_applyJoinsToManager` (reuse
  `selectNamedJoins` + the `CTEJoin`→`buildWithJoinNode(name, Nodes.OuterJoin)`
  block already in `buildJoinBuckets`) rather than duplicating logic.
- Extend the WithTest case (or add a sibling) to assert the direct-path SQL,
  and drop the `from(subquery)` scaffolding once direct works.

## Out of scope

- Inner `joins(cteSym)` routing (separate story).
