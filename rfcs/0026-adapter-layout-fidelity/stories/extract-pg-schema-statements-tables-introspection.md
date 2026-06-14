---
title: "Extract PG table/view introspection statements into PostgreSQLSchemaStatements"
status: claimed
updated: 2026-06-14
rfc: "0026-adapter-layout-fidelity"
cluster: adapter-layout
deps: ["extract-pg-schema-statements-schemas-databases"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: "2026-06-14T21:30:12Z"
assignee: "extract-pg-schema-statements-tables-introspection"
blocked-by: null
---

## Context

`packages/activerecord/src/connection-adapters/postgresql-adapter.ts` inlines
~2,000 lines of schema-management implementation (the 2,671–4,443 block plus the constraint methods at ~4,845–5,200) that
Rails keeps in `postgresql/schema_statements.rb`. The TS
`postgresql/schema-statements.ts` interface already covers all 95 Rails method
names; `postgresql/schema-statements-class.ts` holds only `dropTable`. This
story is pure code motion: move the listed group into
`PostgreSQLSchemaStatements` (or host-interface functions per the CLAUDE.md
mixin convention), leaving the adapter delegating. Verify each method's
placement against the Rails file — methods Rails keeps in the adapter (e.g.
the `extensions` family) stay put. Code motion counts double in the diff
(deletion + addition), so the group is sized to ~200–250 moved lines; if it
still exceeds the 500 LOC ceiling, ship the slice that fits and register the
remainder with `pnpm tasks new`.

**This story (~200 moved lines):** `tables`, `views`,
`dataSources`, `tableExists`, `viewExists`, `dataSourceExists`,
`foreignTables`, `foreignTableExists`, `renameTable`, `tableOptions`,
`tableComment`, `tablePartitionDefinition`, `inheritedTableNames`, and the
shared private helpers `relkindExists`, `dataSourceSql`, `quotedScope`,
`referenceNameForTable`, `parseSchemaQualifiedName`.

## Acceptance criteria

- [x] Listed methods live in the mirrored module file; the adapter only delegates.
- [x] No behavior change: no test edits beyond import paths; CI green on all three adapters.
- [x] PR diff under the 500 LOC ceiling; if the group exceeds it, ship the slice that fits and register the remainder as a new story.
