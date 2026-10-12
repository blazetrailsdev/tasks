---
title: "activerecord: migrator test setups read schema_migration / internal_metadata off the pool and load migrations through MigrationContext"
status: draft
updated: 2026-10-12
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8814 ported the `Migration#puts` override into the migrator test setups. The rest of both
setups still differs from Rails:

- `packages/activerecord/src/multi-db-migrator.test.ts` `beforeEach` builds `migrationsA` /
  `migrationsB` by hand from `migrationProxy` + `anonymousMigration`, and builds
  `new SchemaMigration(adapter.pool)` / `new InternalMetadata(adapter.pool)`. Rails reads them from
  the pool and from disk
  (`vendor/rails/v8.0.2/activerecord/test/cases/multi_db_migrator_test.rb:22-44`):
  `@pool_a.schema_migration`, `@pool_a.internal_metadata`, and
  `ActiveRecord::MigrationContext.new(@path_a, @schema_migration_a, @internal_metadata_a).migrations`
  with `@path_a = MIGRATIONS_ROOT + "/valid"`, `@path_b = MIGRATIONS_ROOT + "/to_copy"`. The file
  already declares `PATH_A` / `PATH_B`.
- `packages/activerecord/src/migrator.test.ts` `beforeEach` builds
  `new SchemaMigration(adapter.pool)` / `new InternalMetadata(adapter.pool)` where Rails has
  `@pool = ActiveRecord::Base.connection_pool`, `@pool.schema_migration`, `@pool.internal_metadata`
  (`vendor/rails/v8.0.2/activerecord/test/cases/migrator_test.rb:20-28`).
- `packages/activerecord/src/migration.ts:269-274` keeps a module-level `writeMigrationMessage`
  that nothing calls. `Migration#write` (`migration.rb:1001-1003`) is the only write path.

## Acceptance criteria

- [ ] Both `beforeEach` blocks read `schemaMigration` / `internalMetadata` off the pool, and
      `multi-db-migrator.test.ts` loads its migrations through `MigrationContext#migrations` from
      the two fixture paths, as Rails' setup does.
- [ ] `writeMigrationMessage` is deleted.
- [ ] No test names change; `pnpm parity:test` and `pnpm parity:test:assertions` deltas non-negative.
