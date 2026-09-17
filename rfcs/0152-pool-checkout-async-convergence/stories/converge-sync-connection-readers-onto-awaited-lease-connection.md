---
title: "converge-sync-connection-readers-onto-awaited-lease-connection"
status: closed
updated: 2026-09-16
rfc: "0152-pool-checkout-async-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "duplicate of converge-sync-connection-lease-per-checkout-verify; the reader arm was split back out of trails#7846"
---

## Context

`converge-sync-connection-lease-per-checkout-verify` deleted `ConnectionPool#leaseConnectionSync`
and settled the RFC's open question for the three synchronous connection readers:

- `DatabaseTasks.migrationConnection` (`database_tasks.rb:533-535`) now returns the awaited
  `migration_class.lease_connection` (5 callers, all in async bodies).
- The deprecated `ConnectionHandling#connection` (`connection_handling.rb:274-294`,
  `packages/activerecord/src/connection-handling.ts`) and the two sync `connection` getters in
  `packages/activerecord/src/migration.ts` (`Migration#connection`, `migration.rb:1036-1038`;
  `Migrator#connection`, `migration.rb:1360-1362`, via `threadedMigrationConnection`) answer
  only a connection already threaded in the execution context, mark the lease sticky through
  the Rails call, and raise `ConnectionNotEstablished` otherwise.

Returning the awaited lease from those three sync readers was measured at ~543 synchronous
`Base.connection` reads in AR tests plus every `this.connection.x` in `Migrator`, so it did not
fit. They carry `@missingRailsCall … — CONVERGEABLE` receipts pointing here.

## Acceptance criteria

- `Base.connection` (deprecated), `Migration#connection` and `Migrator#connection` reach
  `lease_connection` / `migration_connection` with no cold-path raise Rails does not have.
- `threadedMigrationConnection` in `migration.ts` is deleted.
- The receipts naming this story are removed.
