---
title: "Converge leftJoins(table, on) trails-only two-string form to Rails variadic left_outer_joins"
status: in-progress
updated: 2026-06-30
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 4342
claim: "2026-06-30T17:32:47Z"
assignee: "converge-leftjoins-table-on-trails-heuristic"
blocked-by: null
---

## Context

PR #4325 removed the trails-only two-string `joins(table, on)` heuristic from
`Relation#joins`, converging it to Rails' variadic, type-based surface. The
sibling `Relation#leftJoins` (`packages/activerecord/src/relation.ts` ~1901)
still carries the same Rails-incompatible two-argument form
`leftJoins(table, on)`, pushing `{ type: "left", table, on }` onto
`_joinClauses`. Rails has no such API: `left_outer_joins(*args)` is variadic
and routes a raw SQL fragment as a single string
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:883-895`,
`left_outer_joins! { self.left_outer_joins_values |= args }`).

This is the direct analogue of the converged `joins` deviation and is the last
remaining producer (besides where-association joins) of the explicit-ON
`_joinClauses` branch documented in `merged-join-alias-tracker.ts:61` and the
`joinsValues` setter comment.

## Acceptance criteria

- Remove the `leftJoins(table, on)` two-string overload and its
  `{ type: "left" }` `_joinClauses` producer.
- Route explicit-ON left joins through Rails' raw-fragment path: a single SQL
  string, e.g. `leftJoins("LEFT OUTER JOIN comments ON ...")`.
- Convert in-repo call sites (e.g. `inner-join-association.test.ts`
  `leftOuterJoins("comments", "...")`).
- No regression in left-join SQL emission / alias tracking.

## Out of scope

- where-association `_joinClauses` entries (the `c.assoc` branch).
