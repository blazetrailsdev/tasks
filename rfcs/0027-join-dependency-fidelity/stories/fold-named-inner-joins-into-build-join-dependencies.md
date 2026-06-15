---
title: "Fold plain .joins(:assoc) into buildJoinDependencies (drop _joinClauses SQL pre-resolution)"
status: ready
updated: 2026-06-15
rfc: "0027-join-dependency-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by PR #3304 (joins-assoc-retains-target-klass-for-type-resolution).

In Rails, `.joins(:assoc)` stores the association name in `joins_values`, which
feeds `build_join_dependencies` (query_methods.rb:1735). Every node in the join
chain — base, through, target — is therefore represented in the join-dependency
tree with its `base_klass`, so `lookup_table_klass_from_join_dependencies` and
`lookup_cast_type_from_join_dependencies` (calculations.rb:602) resolve any
joined column's klass/cast-type for free.

trails deviates: `Relation#joins` (relation.ts) eagerly pre-resolves a simple
`.joins(:assoc)` into a `_joinClauses` SQL entry (table + ON), and only routes
nested-through chains through `_namedInnerJoins` → JoinDependency. PR #3304
patched the resulting gap by retaining the target/through `klass` on each
`_joinClauses` entry and adding a `_joinClauses` fallback scan to both
`lookupTableKlassFromJoinDependencies` (query-methods.ts) and
`lookupCastTypeFromJoinDependencies` (calculations.ts). That closes the
cast-type hole but leaves two parallel join-resolution code paths
(`_resolveAssociationJoin` / `_resolveThroughJoin` / `_resolveHabtmJoin` vs.
JoinDependency) and a `_joinClauses`-shaped band-aid in the lookups.

Deeper convergence: route ALL named association joins (not just nested-through)
through `buildJoinDependencies` so the flat `_resolve*Join` resolvers and the
`_joinClauses`-klass fallback can be deleted, matching Rails' single
join-dependency source of truth. This also unifies AliasTracker self-join
aliasing and where-clause table-klass lookups across simple and through joins.

Verify against `vendor/rails/activerecord/lib/active_record/relation/query_methods.rb`
(`build_join_dependencies`, `select_named_joins`, `build_joins`).

## Acceptance criteria

- Simple `.joins(:assoc)` is resolved via `buildJoinDependencies` /
  JoinDependency rather than the flat `_resolveAssociationJoin` →
  `_joinClauses` path.
- The `_joinClauses`-klass fallback added in #3304 to
  `lookupTableKlassFromJoinDependencies` and
  `lookupCastTypeFromJoinDependencies` is removed (klass resolves through the
  join-dependency walk, as in Rails).
- `_resolveAssociationJoin` / `_resolveThroughJoin` / `_resolveHabtmJoin` are
  removed or reduced to JoinDependency delegation; no behavior regression.
- Existing joins/calculations/where suites pass on all three adapters
  (sqlite/postgres/mysql).
