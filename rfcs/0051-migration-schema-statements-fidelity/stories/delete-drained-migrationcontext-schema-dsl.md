---
title: "Delete the drained schema-DSL MigrationContext, freeing the Rails name"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: ["route-migrationcontext-dsl-callers-onto-schema-statements"]
deps-rfc: []
est-loc: 250
priority: null
pr: 5801
claim: "2026-08-01T17:28:14Z"
assignee: "delete-drained-migrationcontext-schema-dsl"
blocked-by: null
closed-reason: null
---

## Context

Step 2 of 3 in freeing the `MigrationContext` name (see
`route-migrationcontext-dsl-callers-onto-schema-statements` for step 1 and the
full rationale).

Once every external caller reads the adapter's `schemaStatements()` directly,
trails' schema-DSL `MigrationContext`
(`packages/activerecord/src/migration.ts:1653-2062`) is dead weight: 409 lines
of delegation wrapping a class Rails uses for something else entirely. Rails'
`MigrationContext` (`vendor/rails/activerecord/lib/active_record/migration.rb:1211-1402`)
owns migration discovery and the migrate/up/down entry points and has no schema
DSL.

Deleting it frees the name for step 3, which moves the long-lived half of
trails' merged `Migrator` onto it under Rails' layout.

Mind the `tableNamePrefix` / `tableNameSuffix` accessor pair (`:1663-1678`):
they read through to `Migration.tableNameOptions()` when unset, so any consumer
relying on a per-context override has to be checked before the pair goes. Rails
has no per-context prefix — it reads
`ActiveRecord::Base.table_name_prefix` at use time.

## Acceptance criteria

- The schema-DSL `MigrationContext` class is deleted from `migration.ts`, along
  with its private `schema` getter and its export from
  `packages/activerecord/src/index.ts`.
- No remaining reference to the schema-DSL `MigrationContext` anywhere under
  `packages/*/src`; the name is free for step 3.
- Any `tableNamePrefix` / `tableNameSuffix` consumer is routed to
  `Migration.tableNameOptions()` (Rails' source of truth) rather than losing the
  value silently.
- `pnpm parity:api:extra --package activerecord` shows the novel count for
  `migration.ts` drop; record before/after in the PR body.
- No test renames. Migration, migrator and schema suites green on all three
  lanes.

## Sequencing

Depends on step 1 landing first. Step 3 is
`rename-merged-migrator-into-migrationcontext-and-migrator`.
