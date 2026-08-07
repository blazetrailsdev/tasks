---
title: "createAndMigrate's adapters carry a real pool, so record_environment reads it as Rails does"
status: claimed
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: "2026-08-07T19:20:43Z"
assignee: "strftime-lacks-composite-conversions"
blocked-by: null
closed-reason: null
---

## Context

`test-databases.ts`'s `createAndMigrate` is the last production site still on
`Migrator`'s legacy `(adapter, migrations, options)` arm after PR #6184 widened
the constructor to Rails' `(direction, migrations, schema_migration,
internal_metadata, target_version)` (`migration.rb:1421-1433`).

It cannot move yet. Its adapters are handed in bare, so they carry a `NullPool`
(`abstract-adapter.ts:829-833`) and `Migrator#_recordedEnvironment`'s primary
branch — Rails' `record_environment` reading
`connection.pool.db_config.env_name` (`migration.rb:1512-1516`) — never fires.
The invented `MigratorOptions.environment` is the only thing keeping
`ar_internal_metadata.environment` at `"test"` instead of whatever
TRAILS_ENV/NODE_ENV happen to be. The call site carries that reason today.

Rails has no `@environment` ivar and no such constructor option at all; Rails'
`TestDatabases` also defines no `create_and_migrate` (test_databases.rb has
only `create_and_load_schema`), so there is no Rails call shape to converge the
site itself to.

## Converged shape

`createAndMigrate`'s adapters arrive attached to a real pool built from the
test `dbConfig`, so `pool.dbConfig.envName` answers `"test"` on its own. Once
it does, the site moves to the Rails-shaped arm, and `Migrator`'s `_environment`
field, its `_recordedEnvironment` fallback and `MigratorOptions.environment`
all delete — leaving `record_environment` reading the pool exactly as
`migration.rb:1512-1516` does.

## Acceptance criteria

- [ ] `createAndMigrate` builds its Migrator with `SchemaMigration` /
      `InternalMetadata` in Rails' parameter order.
- [ ] `ar_internal_metadata.environment` is still `"test"` after
      `createAndMigrate`, with TRAILS_ENV unset — covered by a test that fails
      on the naive move.
- [ ] `Migrator._environment`, `_recordedEnvironment`'s fallback arm and
      `MigratorOptions.environment` are gone.
