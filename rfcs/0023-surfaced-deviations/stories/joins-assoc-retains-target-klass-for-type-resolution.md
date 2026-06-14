---
title: "joins(:assoc) should retain target klass so aggregate/where cast-type resolution works without a registry scan"
status: ready
updated: 2026-06-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by PR #3271 (calculations-aggregate-column-through-joins). Our
`.joins(:assoc)` eagerly pre-resolves an association join into a `_joinClauses`
entry that keeps only the SQL table name + ON string — the target reflection /
klass is discarded. Rails keeps the join dependency (joins_values feed
`build_join_dependencies`), so `lookup_table_klass_from_join_dependencies`
resolves the joined model for any plain `.joins(:assoc)`.

Because the klass is gone, `resolveColType` in
`packages/activerecord/src/relation/calculations.ts` had to fall back to
`joinedColumnType`, which scans the **global** `modelRegistry` for a model whose
`tableName` matches a `_joinClauses` table. It works but is a band-aid: it
ignores scope, can mis-resolve when two models share a table name, and
duplicates what Rails' join dependency already knows.

Deeper fix: carry the reflection/target klass on the `_joinClauses` entry (or
fold named association joins into `buildJoinDependencies` so
`lookupTableKlassFromJoinDependencies` covers plain `.joins(:assoc)`), then
delete `joinedColumnType` and let `lookupCastTypeFromJoinDependencies` cover it.
This also benefits `arelColumnWithTable` / where-clause table-klass lookups.

## Acceptance criteria

- `.joins(:assoc)` retains enough association metadata that
  `lookupTableKlassFromJoinDependencies(tableName)` resolves the joined model
  without a global registry scan.
- `joinedColumnType` (the `modelRegistry` table-name scan) is removed from
  `calculations.ts`; cast-type resolution for an aggregate over a joined column
  goes through the join dependencies.
- Existing aggregate-through-joins behavior (PR #3271 tests) still passes on all
  three adapters.
