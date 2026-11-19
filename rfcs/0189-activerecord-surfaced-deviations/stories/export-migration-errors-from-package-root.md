---
title: "activerecord: export PendingMigrationError and the other migration.rb errors from the package root"
status: draft
updated: 2026-11-19
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`PendingMigrationError` (Rails: `ActiveRecord::PendingMigrationError`,
`vendor/rails/v8.0.2/activerecord/lib/active_record/migration.rb:147`) is
defined in `packages/activerecord/src/migration.ts`, but the package root
`packages/activerecord/lib/index.ts` re-exports only some of the migration
errors at `:245` (`UnknownMigrationVersionError`, `ProtectedEnvironmentError`,
…). `@blazetrails/activerecord`'s `exports` map has only `"."`, so a consumer
cannot reach the class at all.

Surfaced building the tasks CLI's pending-migration guard (tasks
`ec873663e`, `src/migrator.ts` `checkPendingMigrations`). It wanted to raise
the Rails error and had to throw a bare `Error` instead.

## Acceptance criteria

- [ ] `ActiveRecord::PendingMigrationError` and the other public
      `migration.rb` error classes (`MigrationError`, `IrreversibleMigration`,
      `DuplicateMigrationVersionError`, `DuplicateMigrationNameError`,
      `UnknownMigrationVersionError`, `IllegalMigrationNameError`,
      `PendingMigrationError`, `ConcurrentMigrationError`,
      `NoEnvironmentInSchemaError`, `ProtectedEnvironmentError`,
      `EnvironmentMismatchError`, `EnvironmentStorageError`) are importable
      from `@blazetrails/activerecord`.
- [ ] tasks' `checkPendingMigrations` then throws `PendingMigrationError`.
