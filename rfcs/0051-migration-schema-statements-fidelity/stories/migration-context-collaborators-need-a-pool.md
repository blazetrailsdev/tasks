---
title: "MigrationContext's optional collaborators and SchemaMigration#connection are the adapter-vs-pool gap"
status: ready
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 140
pr: null
claim: null
assignee: null
blocked-by: null
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
