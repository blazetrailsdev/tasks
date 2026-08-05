---
title: "check_current_protected_environment! should use pool.migration_context, blocked by InternalMetadata#enabled? not reading db_config"
status: done
updated: 2026-08-05
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 120
pr: 6122
claim: "2026-08-05T09:45:03Z"
assignee: "retire-module-level-find-target-engine-exports"
blocked-by: null
closed-reason: null
---

## Context

Rails' `check_current_protected_environment!`
(`vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb:635-637`)
reaches the migration context straight off the pool:

```ruby
with_temporary_pool(db_config) do |pool|
  migration_context = pool.migration_context
```

PR #5859 ported the body faithfully but could not use that call. It went
through `DatabaseTasks.withTemporaryConnection` +
`DatabaseTasks._migrationContextFor(adapter, dbConfig)`
(`packages/activerecord/src/tasks/database-tasks.ts:347`) instead, which also
forced `_migrationContextFor` to drop `private`.

Two things block the Rails call:

1. `ConnectionPool#migrationContext`
   (`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:547`)
   builds `new MigrationContext(migrationsPaths, schemaMigration,
internalMetadata)`, and `pool.internalMetadata` (same file, line 540) is
   constructed as `new InternalMetadata(this._getAdapterProxy())` with no
   `use_metadata_table` gate. Rails' `InternalMetadata#enabled?`
   (`vendor/rails/activerecord/lib/active_record/internal_metadata.rb:35-36`)
   is `@pool.db_config.use_metadata_table?`. trails only honours that flag
   when the caller passes `{ enabled: dbConfig.useMetadataTable }` by hand,
   which is exactly what `_migrationContextFor` does — so switching the
   protected-env check to `pool.migrationContext` today would silently ignore
   `useMetadataTable: false` configs.

2. Rails' `with_temporary_pool` is lazy — the connection is established inside
   the block when the context first queries. trails'
   `withTemporaryConnection` leases eagerly, so `NoDatabaseError` can surface
   from the lease rather than from inside the block. PR #5859 compensated by
   wrapping the whole `withTemporaryConnection` call in the `try`, where Rails
   puts `rescue ActiveRecord::NoDatabaseError` inside the block body
   (`database_tasks.rb:648-649`). Same outcome, different shape.

Related but distinct: `migration-context-collaborators-need-a-pool` covers
`MigrationContext`'s optional collaborators and the adapter-vs-pool threading;
this story is specifically about `InternalMetadata#enabled?` sourcing its flag
from `pool.db_config` so `pool.migrationContext` becomes usable by callers.

## Acceptance criteria

- [ ] `InternalMetadata`'s enabled state derives from the pool's db_config
      (`use_metadata_table`), mirroring `internal_metadata.rb:35-36`, rather
      than requiring an explicit `{ enabled }` option at every construction
      site.
- [ ] `ConnectionPool#migrationContext` therefore honours
      `useMetadataTable: false` configs.
- [ ] `checkCurrentProtectedEnvironmentBang` uses `withTemporaryPool` +
      `pool.migrationContext`, mirroring `database_tasks.rb:635-637`, and the
      `NoDatabaseError` rescue moves inside the block to match
      `database_tasks.rb:648-649`.
- [ ] `DatabaseTasks._migrationContextFor` goes back to `private` (or is
      removed) if no other caller needs it.
- [ ] Existing protected-environment tests still pass, including the
      `useMetadataTable` coverage.
