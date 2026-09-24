---
title: "converge-migration-connection-cold-arm-onto-awaited-lease"
status: in-progress
updated: 2026-09-24
rfc: "0152-pool-checkout-async-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8030
claim: "2026-09-24T13:26:46Z"
assignee: "converge-migration-connection-cold-arm-onto-awaited-lease"
blocked-by: null
closed-reason: null
---

## Context

Split out of `converge-cold-connection-reader-raise-onto-awaited-lease`. That story's PR converged
`ConnectionHandling#connection` (`connection_handling.rb:274-290`) onto `pool.lease_connection`:
it now returns `Promise<DatabaseAdapter>` and every caller awaits it. The Migration half did not fit
in the same PR.

`Migration#connection` (`packages/activerecord/src/migration.ts`, the `get connection(): A` getter
near `:934`) still answers only an already-threaded connection:

- Rails `migration.rb:1036-1038` is `@connection || ActiveRecord::Tasks::DatabaseTasks.migration_connection`,
  and `migration_connection` (`tasks/database_tasks.rb:533-535`) is `migration_class.lease_connection`,
  which checks a connection out (`connection_pool.rb:315-319`).
- trails reads `_DatabaseTasks.migrationConnectionPool().activeConnection`, fires
  `void _DatabaseTasks.migrationConnection()` to make the lease sticky, and raises
  `ConnectionNotEstablished("No connection is leased for this execution context. …")` when nothing is
  threaded. Rails has no such raise.

`_DatabaseTasks.migrationConnection()` already returns the awaited lease (trails#8007). The cold arm
therefore has to return `Promise<A>`. That reaches the `this.connection` reads inside `migration.ts`
itself (~17: `methodMissing` at `:1161-1188`, `revert`, `execMigration`, `indexName`,
`CommandRecorder` construction) and every migration body in the tests that reads `this.connection` /
`migration.connection` synchronously (`migration/columns.test.ts` ~51 via `self.connection`,
`migration.test.ts`, `migration.trails.test.ts`, `invertible-migration.test.ts`,
`test-helpers/migration-helper.ts`, `migration/default-strategy.ts`, `schema.ts`).

Note that `execMigration` sets `_connectionOverride` (Rails `@connection`) for the whole run, so the
warm arm stays synchronous in practice. Only the cold `migration_connection` arm needs the await.

## Acceptance criteria

- `Migration#connection` is `@connection || migration_connection` with no `ConnectionNotEstablished`
  raise Rails lacks. On the cold path it reaches `DatabaseTasks.migrationConnection()`'s awaited lease.
- The raise site in `migration.ts` and its message string are deleted, along with the
  `ConnectionNotEstablished` import if it becomes unused.
- The trails-only test `migration.connection raises ConnectionNotEstablished when no connection is leased`
  (`migration.trails.test.ts:38`) is rewritten to assert Rails' checkout.
- Callers await where the connection can be cold, and warm migration bodies keep Rails' shape.
