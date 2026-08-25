---
title: "Route MigrationContext schema-DSL callers onto the adapter's schemaStatements"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: 5792
claim: "2026-08-01T03:13:50Z"
assignee: "route-migrationcontext-dsl-callers-onto-schema-statements"
blocked-by: null
closed-reason: null
---

## Context

Step 1 of 3 in freeing the `MigrationContext` name so trails' merged `Migrator`
can be split into Rails' `MigrationContext` + `Migrator` pair (see
`rename-merged-migrator-into-migrationcontext-and-migrator`, which depends on
this chain).

trails uses the name `MigrationContext` for a schema-DSL wrapper that Rails has
no counterpart for: `packages/activerecord/src/migration.ts:1653-2062` (409
lines, 19 DSL methods — `createTable`, `dropTable`, `addColumn`, `removeColumn`,
`renameColumn`, `changeColumn`, `addIndex`, `removeIndex`, `renameTable`,
`createEnum`, `createSchema`, `createVirtualTable`, `enableExtension`,
`changeTableComment`, `changeColumnComment`, `reversible`, plus the
`tableNamePrefix` / `tableNameSuffix` accessor pairs). Rails'
`MigrationContext` (`vendor/rails/activerecord/lib/active_record/migration.rb:1211-1402`)
has no schema DSL at all — it owns migration discovery and the migrate/up/down
entry points.

The class is already a thin delegator: every DSL method routes through its
private `schema` getter, which returns `connection.schemaStatements()` (or a
fresh `SchemaStatements`) — see `migration.ts:1690-1700`. So the callers can be
pointed straight at the adapter's `schemaStatements()` with no behavior change.

Scope: 76 references outside `migration.ts`, across
`packages/activerecord/src/migrator.ts`, `index.ts`, and ~10 test files
(`migration.test.ts`, `migrator.test.ts`, `active-record-schema.test.ts`,
`comment.test.ts`, `date-time-precision.test.ts`, `dirty.test.ts`,
`cache-key.test.ts`, `hot-compatibility.test.ts`,
`schema-introspection.trails.test.ts`, `migration.trails.test.ts`).

## Acceptance criteria

- Every caller of a `MigrationContext` schema-DSL method calls the adapter's
  `schemaStatements()` equivalent instead. The class keeps its methods for now
  (deleting them is step 2) but has no remaining callers outside `migration.ts`.
- Purely mechanical: no behavior change, no test renames, no new surface.
  `migration.ts` itself is not restructured in this story.
- If the 500-LOC ceiling is hit, split by consumer file and register the
  remainder as a follow-up — do NOT open sibling PRs yourself.
- `pnpm parity:api` / `parity:test` deltas non-negative; migration, migrator
  and schema suites green on all three lanes.

## Sequencing

Step 1 of: this story, then `delete-drained-migrationcontext-schema-dsl`, then
`rename-merged-migrator-into-migrationcontext-and-migrator`. Each branches from
`main` after the previous merges — no stacked branches.
