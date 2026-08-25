---
title: "Converge JoinDependency constructor onto Rails' (model, table, associations, join_type)"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 5930
claim: "2026-08-02T23:05:46Z"
assignee: "converge-join-dependency-constructor-arg-order"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #5903 (`converge-relation-table-attr-reader-reads`). Rails'
`JoinDependency.new(model, table, associations, join_type)`
(`query_methods.rb:1598`, `join_dependency.rb:71`) takes the table as the
SECOND positional argument and builds the whole association tree in
`initialize`.

trails' constructor is `(baseModel, joinType?, table?)`
(`packages/activerecord/src/associations/join-dependency.ts`), with
associations added afterwards via `addAssociation` /
`addTreeToJoinDependency`. #5903 threaded the relation's `table` through as a
TRAILING optional param rather than reordering, because ~70 call sites
(`relation.ts`, `relation/query-methods.ts`, and ~59 in tests) pass positional
args and reordering would have blown the 500-LOC ceiling on a convergence PR.

## Acceptance criteria

- Constructor signature converges on Rails' `(model, table, associations,
join_type)` shape, or the deviation is documented at the call site with the
  reason the JS shape cannot mirror it (associations are added incrementally
  because `make_tree` is split across `walkAssociationTree` /
  `addTreeToJoinDependency`).
- All call sites updated; no behavior change (join SQL byte-identical).
- Join/eager suites stay green: `join-dependency*`, `inner-join-association`,
  `left-outer-join-association`, `eager`, `cascaded-eager-loading`.
