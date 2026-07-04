---
title: "Test: leftOuterJoins(:cte) routes to a LEFT OUTER JOIN via build_with_join_node"
status: claimed
updated: 2026-07-04
rfc: "0027-join-dependency-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-07-04T15:49:28Z"
assignee: "leftouterjoins-cte-outer-join-coverage"
blocked-by: null
closed-reason: null
---

## Context

PR #4536 (left-outer-joins-lazy-invalid-arg-raise) added a `CTEJoin` branch to
the left-join path of `buildJoinBuckets`
(`packages/activerecord/src/relation/query-methods.ts`, the `selectNamedJoins`
callback: `if (left instanceof CTEJoin) buckets.join_node.push(buildWithJoinNode.call(this, left.name, Nodes.OuterJoin))`).
This mirrors Rails' `build_join_buckets` block
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1830-1836`):
a symbol left-outer arg matching a `with(...)` CTE name routes to a
`build_with_join_node(name, Arel::Nodes::OuterJoin)` join_node.

Before that PR the left path passed no block, so a CTE name in
`leftOuterJoins` position was silently dropped. The new branch is correct but
has **no direct test** — the PR's tests cover only a whitespace string (Rails
mirror) and a bare Integer (trails widening). The reviewer noted the branch is
"only reachable for a genuine CTEJoin," so a regression there would go unnoticed.

## Acceptance criteria

- Add a test (canonical models + `with(...)` CTE) asserting
  `Model.with(cte: subquery).leftOuterJoins(cteSymbol)` emits a
  `LEFT OUTER JOIN` to the CTE (vs `with(...).joins(cteSymbol)` emitting an
  INNER JOIN), locking in the OuterJoin routing.
- Mirror the corresponding Rails test if one exists in
  `vendor/rails/activerecord/test/` (search `left_outer_joins` + `with`);
  otherwise a trails test with a name that reflects the behavior.

## Out of scope

- The invalid-arg lazy raise (shipped in #4536).
