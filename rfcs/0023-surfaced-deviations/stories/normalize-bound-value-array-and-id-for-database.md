---
title: "fix(activerecord): normalizeBoundValue handles array and idForDatabase bind shapes"
status: claimed
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-06-21T11:58:42Z"
assignee: "normalize-bound-value-array-and-id-for-database"
blocked-by: null
---

## Context

`normalizeBoundValue` (packages/activerecord/src/relation/query-methods.ts, used by `buildBoundSqlLiteral` / `buildNamedBoundSqlLiteral`) only handles the Relation and Arel-node shapes. Rails' `build_bound_sql_literal` / `build_named_bound_sql_literal` (query_methods.rb:1682-1714) additionally normalize:

- arrays (`respond_to?(:map) && !acts_like?(:string)`) → `value.map { |v| v.respond_to?(:id_for_database) ? v.id_for_database : v }`, with empty → `nil`
- single records (`respond_to?(:id_for_database)`) → `value.id_for_database`

This gap is pre-existing (the old per-builder code never had these branches) and was surfaced in PR #3628 review round 2. It pairs with `converge-build-where-clause-bound-sql-literal` (which wires `buildWhereClause` onto these builders); the value-shape normalization can land with that work or independently.

## Acceptance criteria

- [ ] `normalizeBoundValue` handles the array shape: map elements through `idForDatabase`, empty array → `null`, matching `build_bound_sql_literal`
- [ ] `normalizeBoundValue` handles the single-record shape: `value.idForDatabase()` when the value responds to it
- [ ] Direct unit tests cover both shapes through `buildBoundSqlLiteral` / `buildNamedBoundSqlLiteral`
- [ ] api:compare and test:compare deltas non-negative
