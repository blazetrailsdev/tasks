---
title: "MigrationContext's optional collaborators and SchemaMigration#connection are the adapter-vs-pool gap"
status: blocked
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 140
pr: null
claim: "2026-08-07T01:08:29Z"
assignee: "check-pending-migrations-is-a-no-op-stub"
blocked-by: "Blocked on the adapter-vs-pool convergence, not on this story's own shape. Rails' MigrationContext ctor defaults its collaborators eagerly from a pool (`SchemaMigration.new(connection_pool)`, migration.rb:1214-1218). trails' SchemaMigration/InternalMetadata take an ADAPTER, across ~50 `new SchemaMigration(` call sites, so 'default from the pool' has no landing site until those hold a pool. The one adapter a pool can hand over synchronously is ConnectionPool#_getAdapterProxy (connection-pool.ts:459), and that proxy answers a Promise for every member — surfaced concretely while porting pending_migrations_test.rb: `pool.migrationContext.open()` then `migrate()` dies in Migrator#withAdvisoryLock (migration.ts:2199-2211) because the proxy's `supportsAdvisoryLocks?()` returns a truthy Promise and its `currentDatabase` resolves to undefined on SQLite. Second, acceptance bullets 2 and 4 are in tension: Rails' eager default cannot be reached without an established connection, so removing the optional args + throwing getters breaks 'connectionless file discovery still works without a pool' (28 `new MigrationContext([paths])` sites). Note the story's Context is stale on one point: `Migrator.discoverMigrations` / `Migrator.fromPath` no longer exist. Unblock once SchemaMigration/InternalMetadata hold a pool (project_pool_adapter_proxy_makes_sync_methods_async)."
closed-reason: null
---

## Context

Rails' `MigrationContext` defaults its collaborators from a connection pool
(`vendor/rails/activerecord/lib/active_record/migration.rb:1214-1218`):

```ruby
@schema_migration  = schema_migration || SchemaMigration.new(connection_pool)
@internal_metadata = internal_metadata || InternalMetadata.new(connection_pool)
```

with `connection_pool` reaching
`ActiveRecord::Tasks::DatabaseTasks.migration_connection_pool`
(`migration.rb:1365-1367`).

trails threads an _adapter_, not a pool, and has no `DatabaseTasks` pool to
reach from inside `MigrationContext`. PR #5820 worked around that two ways, both
of which should disappear once a pool is reachable here:

1. `MigrationContext`'s `schemaMigration` / `internalMetadata` constructor args
   are **optional**, with getters that throw
   (`"MigrationContext was built without a schema_migration"`) instead of
   defaulting. This exists so `Migrator.discoverMigrations` /
   `Migrator.fromPath` can build a connectionless context for file discovery,
   which genuinely needs neither.
2. `SchemaMigration#connection` (`packages/activerecord/src/schema-migration.ts`)
   was added as an `@internal` getter so `MigrationContext#open` can build a
   `Migrator`. Rails has no such accessor — it holds `@pool` and never exposes
   it.

Both are documented deviations at their call sites, not accidents. They are the
adapter-vs-pool gap surfacing in one more place.

## Acceptance criteria

- [ ] `MigrationContext` reaches a connection pool the way Rails does, and
      defaults `schemaMigration` / `internalMetadata` from it.
- [ ] The optional constructor args and the throwing getters are gone.
- [ ] `SchemaMigration#connection` is gone, or reduced to whatever the pool
      threading makes necessary.
- [ ] Connectionless file discovery still works without a pool.
