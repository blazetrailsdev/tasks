---
title: "Unify the two migration discovery paths and delete the registeredMigrations seam"
status: claimed
updated: 2026-08-21
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
pr: null
claim: "2026-08-21T11:39:15Z"
assignee: "measure-adapter-specific-arm-saving-on-mariadb"
blocked-by: null
closed-reason: null
---

## Context

`MigrationContext#migrations`
(`vendor/rails/activerecord/lib/active_record/migration.rb:1303-1315`) has
exactly one source: `migration_files` scanning `migrations_paths`, and the
constructor at `migration.rb:1214` takes exactly three arguments. trails has
two migration sources, and PR #5860 made the second one explicit rather than
removing it: `MigrationContext`'s constructor now takes a fourth optional
argument, `registeredMigrations?: MigrationProxy[]`
(`packages/activerecord/src/migration.ts:1729-1757`), and `#migrations`
returns it when present (`migration.ts:1988`). That replaced the anonymous
`MigrationContext` subclass `DatabaseTasks._migrationContextFor` used to build
— Rails' test-only `migrator_class` override (`test/cases/migrator_test.rb`)
sitting in production code — so the seam is strictly better than what it
replaced, but it is still surface Rails does not have.

The root deviation is that trails discovers migrations twice:

- `MigrationContext#migrations` / `migrationFiles`
  (`packages/activerecord/src/migration.ts:1986-2031`) scans `migrationsPaths`
  for `/^\d+_.*\.(ts|js)$/`.
- `packages/trailties/src/migration-loader.ts` is a separate loader (hyphen
  aliases and other spellings `parseMigrationFilename` does not accept), whose
  output is handed to `DatabaseTasks.registerMigrations`
  (`packages/activerecord/src/tasks/database-tasks.ts:314-324`) and read back
  by `_migrationsFor` (`database-tasks.ts:333-338`).

The two are not interchangeable today, which is why the in-memory list has to
reach `MigrationContext` at all.

## Acceptance criteria

- [ ] The two discovery paths are unified: either `migration-loader`'s extra
      filename spellings move into `MigrationContext#parseMigrationFilename` /
      `migrationFiles` and trailties calls `MigrationContext#migrations`, or
      the loader writes only into paths `MigrationContext` already scans.
      Whichever way, document the filename spellings that survive.
- [ ] `DatabaseTasks.registerMigrations` / `_migrationsFor` /
      `_migrationsByConfig` are gone, or reduced to a path registration.
- [ ] The `registeredMigrations` constructor argument is deleted from
      `MigrationContext`, restoring Rails' three-argument constructor
      (`migration.rb:1214`), and `#migrations` has a single source again.
- [ ] The DEVIATION JSDoc block on the constructor goes with it.
- [ ] trailties `db` command tests and
      `packages/activerecord/src/migration-context.trails.test.ts` keep their
      names and pass; the registered-list test in the latter is deleted along
      with the seam.

Hard rules: no `node:*` imports, no `process.*`, async fs only, no new runtime
deps, the LOC ceiling, single PR from main.
