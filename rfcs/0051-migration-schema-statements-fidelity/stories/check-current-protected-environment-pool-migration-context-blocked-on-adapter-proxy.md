---
title: "check-current-protected-environment-pool-migration-context-blocked-on-adapter-proxy"
status: blocked
updated: 2026-08-05
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-05T20:13:09Z"
assignee: "check-current-protected-environment-pool-migration-context-blocked-on-adapter-proxy"
blocked-by: "Blocked on migration-context-collaborators-need-a-pool. Rails' InternalMetadata/SchemaMigration hold a *pool* and do their own `@pool.with_connection` (internal_metadata.rb:18-20, 40-44); trails threads an adapter, and ConnectionPool#migrationContext bridges that with the withConnection-dispatching adapter proxy (connection-pool.ts:447) that async-ifies the synchronous toSql the queries need. Neither half of criterion 1 is reachable without moving those collaborators onto a pool, which is 101 `new SchemaMigration(adapter)`/`new InternalMetadata(adapter)` construction sites across packages/ and scripts/ — far past this bundle's 500 LOC ceiling, and already scoped as its own ready story."
closed-reason: null
---

## Context

`check_current_protected_environment!`
(`vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb:635-649`)
reads the migration context straight off the pool and rescues
`NoDatabaseError` _inside_ the block:

```ruby
with_temporary_pool(db_config) do |pool|
  migration_context = pool.migration_context
  ...
rescue ActiveRecord::NoDatabaseError
end
```

`check-current-protected-environment-uses-pool-migration-context` converged the
half it could: `InternalMetadata#enabled?` now derives from the pool's
db_config (`internal_metadata.rb:35-36`) instead of an explicit `{ enabled }`
constructor option, and `ConnectionPool`'s adapter proxy answers `pool` with
the pool itself so `pool.internalMetadata.enabled` honours
`useMetadataTable: false`.

The call-shape half did **not** land, blocked by two things measured on the
branch:

1. `ConnectionPool#migrationContext`
   (`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:511`)
   builds `SchemaMigration` / `InternalMetadata` over `_getAdapterProxy()`
   (same file, `:447`), whose `get` trap routes **every** member through
   `pool.withConnection(...)`. `InternalMetadata#tableExists`
   (`internal-metadata.ts:219`) calls the _synchronous_ `this._connection.toSql(sm)`,
   which through the proxy returns a Promise — the query then receives a Promise
   instead of SQL and better-sqlite3 raises
   `TypeError: Expected first argument to be a string`, so `tableExists()`
   swallows it and answers `false`. Switching the check to
   `pool.migrationContext` reds 11 tests across
   `tasks/database-tasks-protected-environments-env.trails.test.ts`,
   `tasks/database-tasks.test.ts` and `trailties/src/commands/db.test.ts` with
   `NoEnvironmentInSchemaError`. This is the pool-proxy sync/async surface gap.
2. `DatabaseTasks.withTemporaryConnection` leases eagerly, so `NoDatabaseError`
   can surface from the lease rather than from inside the block — which is why
   the rescue currently wraps the whole call instead of sitting inside it
   (`database_tasks.rb:648-649`).

`checkCurrentProtectedEnvironmentBang`
(`packages/activerecord/src/tasks/database-tasks.ts`) therefore still goes
through `withTemporaryConnection` + `DatabaseTasks._migrationContextFor`, and
`_migrationContextFor` still carries `@internal` rather than `private`. Both
deviations are documented at the call site.

## Acceptance criteria

- [ ] The pool's adapter proxy stops async-ifying the synchronous adapter
      surface (or `ConnectionPool#migrationContext` builds its collaborators
      over something that doesn't), so `pool.internalMetadata.tableExists()` and
      `pool.schemaMigration` queries work.
- [ ] `checkCurrentProtectedEnvironmentBang` uses `withTemporaryPool` +
      `pool.migrationContext`, mirroring `database_tasks.rb:635-637`.
- [ ] The `NoDatabaseError` rescue moves inside the block
      (`database_tasks.rb:648-649`).
- [ ] `DatabaseTasks._migrationContextFor` goes back to `private`, or is
      removed if no caller remains.
- [ ] The protected-environment suites above stay green, including the
      `useMetadataTable` coverage.
