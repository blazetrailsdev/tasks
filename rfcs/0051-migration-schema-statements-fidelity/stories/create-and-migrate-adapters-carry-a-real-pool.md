---
title: "createAndMigrate's adapters carry a real pool, so record_environment reads it as Rails does"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6197
claim: "2026-08-07T19:52:41Z"
assignee: "relation-proxy-respond-to-missing"
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

## Findings, 2026-08-07 (from the `strftime-lacks-composite-conversions` bundle)

Claimed as part of a bundle and released unbuilt after investigation. Two facts
the next agent should not re-derive:

**The story's premise — "its adapters are handed in bare, so they carry a
NullPool" — is false for the only caller.** `createAndMigrate`'s sole call site
(`test-databases.test.ts:295`) passes `Base.connection`, whose `pool` is a real
`ConnectionPool`, not a `NullPool`. So `Migrator#_recordedEnvironment`'s primary
branch already fires there; the `environment` option is not what is keeping the
value off `NullConfig`.

**Reading the pool does NOT answer `"test"` — it answers `"arunit"`.** Probed on
`origin/main`: `(Base.connection.pool as ConnectionPool).dbConfig.envName ===
"arunit"` (Rails' own AR-suite env name, mirrored by our test config). So
acceptance criterion 2 as written ("`ar_internal_metadata.environment` is still
`"test"` after `createAndMigrate`") is unsatisfiable by the converged shape:
converging `record_environment` to `migration.rb:1512-1516` necessarily changes
the stamped value from `"test"` to `"arunit"`. The criterion has to be restated
as "answers the pool's `env_name`" — and every assertion that reads the stamp
back has to move with it — or the story has to specify a distinct test
`dbConfig` whose `envName` really is `"test"` and say where `createAndMigrate`
gets it from.

Building a pool _inside_ `createAndMigrate` for a bare adapter is also not the
cheap move it looks like: `new ConnectionPool(poolConfig)` starts a `Reaper`
(`connection-pool.ts:370-371`), so a pool minted only to carry an `env_name`
leaks a live timer per call.

The rest of the story is accurate and small: `Migrator._environment`, the
`_recordedEnvironment` fallback arm and `MigratorOptions.environment` are all
still on `origin/main`, and the only non-test consumer is
`test-databases.ts:31`. The three test call sites that pass
`{ environment: "test" }` are `migrator.trails.test.ts:69,81,221`, and all three
already assert against `envName(adapter)` (the pool read) rather than the
literal `"test"` — so they converge for free.
