---
title: "references_eager_loaded_tables? should read tables off built join nodes"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already converged: relation.ts:1238 now calls this.buildJoins(arel) on a throwaway SelectManager and derives joinedTables from the returned join nodes (StringJoin -> tablesInString(join.left), else join.left.name), then pushes table.name, downcases and compares against referencesValues — relation.rb:1475-1489 line for line. _resolveAssocTables is gone."
---

## Context

`Relation#referencesEagerLoadedTables` (packages/activerecord/src/relation.ts:2590-2640)
approximates `references_eager_loaded_tables?`
(vendor/rails/activerecord/lib/active_record/relation.rb:1474-1489), which builds
the real join nodes — `build_joins([])` — and reads `join.left.name` /
`tables_in_string(join.left)` off them. trails instead resolves association specs
to table names inline (`_resolveAssocTables`) and only string-matches raw joins,
so a `joins()` CTE symbol (routed by `select_named_joins`, query_methods.rb:1865-1873,
to `build_with_join_node`) never contributes its table. Surfaced reviewing PR #6579.

## Converged shape

Call the ported `buildJoins`/`buildJoinBuckets` with an empty join-sources array
and derive `joined_tables` from the returned nodes exactly as relation.rb:1475-1481
does (`Arel::Nodes::StringJoin` → `tables_in_string(join.left)`, else
`join.left.name`), then `joined_tables << table.name`, downcase, and compare
against `references_values`.

## Acceptance criteria

- [ ] `referencesEagerLoadedTables` derives joined tables from built join nodes, not from spec resolution.
- [ ] `_resolveAssocTables` (a trails-only helper) is deleted if it has no other caller.
- [ ] `pnpm parity:api:calls` / `:args` non-regressed; SQLite, PG, MySQL green.
