---
title: "route-remaining-migrationcontext-dsl-callers-onto-schema-statements"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5793
claim: "2026-08-01T03:23:46Z"
assignee: "route-remaining-migrationcontext-dsl-callers-onto-schema-statements"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `route-migrationcontext-dsl-callers-onto-schema-statements`, which
hit the 500-LOC ceiling after converting the ten files named in its scope
(`migration.test.ts`, `comment.test.ts`, `cache-key.test.ts`,
`date-time-precision.test.ts`, `dirty.test.ts`, `hot-compatibility.test.ts`,
`active-record-schema.test.ts`, `schema-introspection.trails.test.ts`). The
remaining `new MigrationContext(...)` callers, all outside
`packages/activerecord/src/migration.ts`, are:

- `schema-dumper.test.ts` (12), `defaults.test.ts` (8), `timestamp.test.ts` (3),
  `schema-dumper.trails.test.ts` (2), `time-precision.test.ts` (1),
  `bigint-roundtrip.test.ts` (1)
- `associations/`: `required.test.ts`, `loader-methods.test.ts`,
  `eager-singularization.test.ts`, `disable-joins-routing-widening.test.ts`,
  `disable-joins-nested-through.test.ts`,
  `disable-joins-composite-nested.test.ts`,
  `disable-joins-composite-key.test.ts`,
  `disable-joins-association-scope.test.ts`,
  `cp-count-disable-joins-through.test.ts` (1 each)
- `tasks/database-tasks.ts:967`, `connection-adapters/abstract/connection-pool.ts:541-545`
  (`pool.migrationContext`), and the `MigrationContext` type references in
  `support/schema-file-generator.ts` / `schema-dumper.ts`'s generated
  `defineSchema(ctx: MigrationContext)` preamble
- `migration.trails.test.ts` (4) — dedicated regression tests _of_ the
  MigrationContext class; these are expected to be deleted along with the class
  in `delete-drained-migrationcontext-schema-dsl` rather than converted

The conversion is mechanical: `ctx.<dslMethod>(...)` → `adapter.<dslMethod>(...)`
(Rails' `connection.create_table` etc. — the adapter mixes in
`SchemaStatements`). Two non-mechanical spots to watch, both already resolved
once in the parent PR: `renameTable` prefix/suffix application lives on
`Migration` (via `properTableName`), not on the adapter; and
`removeColumn(t, c, { ifExists })` must become
`removeColumn(t, c, undefined, { ifExists })` because the adapter's third
positional is `type`.

## Acceptance criteria

- No `new MigrationContext(...)` callers remain outside `migration.ts` (other
  than `migration.trails.test.ts`, deferred to the deletion story).
- Purely mechanical; no test renames, no new surface, no behavior change.
- `pnpm parity:api` / `parity:test` deltas non-negative; touched suites green
  on all three lanes.
