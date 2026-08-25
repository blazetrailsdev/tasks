---
title: "MigrationContext is built by subclass override instead of migrationsPaths"
status: closed
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 5860
claim: null
assignee: null
blocked-by: null
closed-reason: "PR #5860 closed unmerged: the constructor seam it added formalizes trails' second migration source instead of removing it (Rails' MigrationContext takes three constructor args, migration.rb:1214, and #migrations has one source, 1303-1315). Superseded by unify-migration-discovery-delete-registered-migrations-seam, which converges the two discovery paths and deletes the seam; the decision context is recorded on migrator-run-surface-caller-migration."
---

## Context

Rails' `MigrationContext#migrations` reads `migrations_paths` off disk
(`vendor/rails/activerecord/lib/active_record/migration.rb:1303-1315`,
`migration_files` at 1369-1372). trails also registers migrations in memory —
`DatabaseTasks.registerMigrations` / `_migrationsFor(dbConfig)` — so
`DatabaseTasks._migrationContextFor`
(`packages/activerecord/src/tasks/database-tasks.ts`, added by PR #5845) builds
a `MigrationContext` **subclass** that overrides the `migrations` getter to
return the registered list, and passes `migrationsPaths` only so the
path-reading half is not left empty.

Rails uses that override only in a test helper (`migrator_class` in
`vendor/rails/activerecord/test/cases/migrator_test.rb`), never in production
code. Two migration sources coexisting is the underlying deviation, and it is
what blocks `migrator-run-surface-caller-migration`: the ~24 callers that hold a
pre-built `MigrationProxy[]` have no non-subclass way to reach a
`MigrationContext`.

`packages/trailties/src/commands/db.ts` has its own loader
(`packages/trailties/src/migration-loader.ts` — hyphen aliases, etc.) rather
than `MigrationContext#migrations`, so the two discovery paths are not
interchangeable today.

## Acceptance criteria

- [ ] Decide how a caller holding a pre-built `MigrationProxy[]` reaches a
      `MigrationContext` without subclassing it in production code — either by
      making the registered list feed `migrationsPaths` discovery, or by an
      explicitly-justified constructor seam.
- [ ] `DatabaseTasks._migrationContextFor` no longer defines an anonymous
      `MigrationContext` subclass.
- [ ] The decision is written down where
      `migrator-run-surface-caller-migration` can act on it.

Hard rules: no `node:*` imports, no `process.*`, async fs only, no new runtime
deps, 500 LOC ceiling, single PR from main.
