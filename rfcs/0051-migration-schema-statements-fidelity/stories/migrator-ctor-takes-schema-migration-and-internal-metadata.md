---
title: "Migrator's constructor takes schema_migration and internal_metadata, as Rails' does"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6184
claim: "2026-08-07T17:13:47Z"
assignee: "fk-test-pair-columns-are-integer-not-bigint"
blocked-by: null
closed-reason: null
---

## Context

Split 1 of 3 from `migrator-connection-pins-adapter-at-construction`, whose
~140 LOC estimate was re-measured at roughly 1500 during PR #6176 and which is
superseded by this trio.

Rails' `Migrator` takes the bookkeeping objects, not a connection
(`vendor/rails/activerecord/lib/active_record/migration.rb:1478-1485`):

```ruby
def initialize(direction, migrations, schema_migration, internal_metadata, target_version = nil)
```

trails' is `new Migrator(adapter, migrations, options)`
(`packages/activerecord/src/migration.ts`, ~:2195-2217), which builds
`new SchemaMigration(adapter)` and `new InternalMetadata(adapter)` itself from
the pinned adapter. Rails' callers pass those in — see
`vendor/rails/activerecord/test/cases/migrator_test.rb:53` and
`multi_db_migrator_test.rb:142,149`, which pass per-database
`@schema_migration_a` / `@schema_migration_b`.

This story widens the constructor to Rails' parameter list while the adapter is
still accepted, so the ~110 existing call sites keep working and can be migrated
file by file in split 2.

## Converged shape

`Migrator`'s constructor reads
`(direction, migrations, schemaMigration, internalMetadata, targetVersion)` in
Rails' order. `direction` and `targetVersion` come off `MigratorOptions` and
become positional, as Rails has them. Production call sites
(`MigrationContext`'s five, `DatabaseTasks._migrationContextFor`,
`activerecord-cli/src/pending-migrations.ts`, `trailties/src/commands/db.ts`,
`test-databases.ts`) construct the two bookkeeping objects and pass them.

## Acceptance criteria

- [ ] The constructor's parameter list and order match migration.rb:1478.
- [ ] `SchemaMigration` / `InternalMetadata` are arguments, not built inside.
- [ ] Production (non-test) call sites pass them; test files may lag to split 2.
- [ ] Migrator, migration and multi-db suites green on all three lanes.
