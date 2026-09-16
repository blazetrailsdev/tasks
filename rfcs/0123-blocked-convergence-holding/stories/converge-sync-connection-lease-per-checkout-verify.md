---
title: "converge-sync-connection-lease-per-checkout-verify"
status: blocked
updated: 2026-09-16
rfc: "0123-blocked-convergence-holding"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: "2026-08-26T17:54:27Z"
assignee: "sqlite-indexes-sorts-index-info-rows-rails-does-not"
blocked-by: "Was 'waits on abstract-adapter-lock-defaults-to-monitor-not-nulllock' — that row is now CLOSED as a duplicate, and the NullLock question is ratified by CLAUDE.md 'The adapter lock defaults to a monitor, not NullLock' (trails#7831). The remaining blocker is the async pool-checkout seam, which is being rehomed to a dedicated convergence RFC; re-point this row there."
closed-reason: null
---

## Context

The pool-checkout RFC `0000-pool-checkout-async-convergence` (Seam inventory §1, Design §1)
owns this story. It will be rehomed there once that RFC merges.

`ConnectionPool#leaseConnectionSync`
(`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:396-411`)
is a sync twin of `lease_connection` (`connection_pool.rb:315`). It never awaits
the per-checkout `verifyBang` that `checkout` (`connection_pool.rb:547`) runs, and
its lease is permanent. `withConnectionSync` (`:417-457`) is the same arm for
`with_connection` (`connection_pool.rb:405`). Both carry
`@noRailsEquivalent CONVERGEABLE sync-reads-of-async-reflection-retire-with-rfc-0073`.

Production callers, re-measured on trails `0236d460b2`. The `arel/nodes/node.ts`
`toSql` site this story originally listed is gone.

| trails site                                          | Rails counterpart                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------ |
| `model-schema.ts:29` `reflectionAdapter`             | `schema_cache` pool read (`model_schema.rb:591`)                   |
| `connection-handling.ts:341` deprecated `connection` | `ConnectionHandling#connection` (`connection_handling.rb:274-290`) |
| `associations/alias-tracker.ts:70` `create`          | `pool.with_connection` (`alias_tracker.rb:10`)                     |
| `tasks/database-tasks.ts:884` `migrationConnection`  | `migration_class.lease_connection` (`database_tasks.rb:533-535`)   |

Test-infrastructure callers: `test-fixtures/fixture-connection.ts:8`,
`test-fixtures/with-transactional-fixtures.ts:164` and
`test-helpers/models/contact.ts:9`.

`withConnectionSync` (`:417-457`) is not in scope. It releases its lease after
the block like Rails' `with_connection` (`connection_pool.rb:405-421`), and its
callers are the synchronous `arel` path ratified by CLAUDE.md § "`Relation` is
evaluated by an async query". It is the scope that `reflectionAdapter` and
`AliasTracker.create` move onto.

This is a convergence, not a language shortcoming. `model-schema.ts:604-611`
records that the lease is permanent and trips
`permanent_connection_checkout = :deprecated | :disallowed` on every save. That
flag was armed in the AR suite by trails#7781. Rails' pool reads never take a
permanent lease.

The earlier blocker named `abstract-adapter-lock-defaults-to-monitor-not-nulllock`.
It does not apply, because nothing here touches the adapter lock.

## Acceptance criteria

- `reflectionAdapter` and `AliasTracker.create` get their connection from
  `pool.withConnectionSync`, as Rails' pool read and `alias_tracker.rb:10`'s
  `pool.with_connection` do. Neither takes a permanent lease, and
  `AliasTracker.create` stays synchronous for its arel-building callers
  (`relation/query-methods.ts:2449`, `associations/association-scope.ts:104`).
- `migrationConnection` and the deprecated `connection` getter keep their Rails
  names and resolve through the async lease. The PR settles the RFC's open
  question (return the awaited lease, or answer only a threaded
  `activeConnection` and raise otherwise), with caller counts for both options.
- `leaseConnectionSync` has 0 definitions and 0 callers under `packages/`,
  including the test-infrastructure callers above.
- The AR suite is green on sqlite3, postgresql and mysql2 with
  `permanent_connection_checkout = :disallowed`.
- `scripts/stale-story-references.test.ts` stays green.
