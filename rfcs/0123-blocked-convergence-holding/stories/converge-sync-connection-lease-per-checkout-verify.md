---
title: "converge-sync-connection-lease-per-checkout-verify"
status: blocked
updated: 2026-09-11
rfc: "0123-blocked-convergence-holding"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-08-26T17:54:27Z"
assignee: "sqlite-indexes-sorts-index-info-rows-rails-does-not"
blocked-by: "waits on abstract-adapter-lock-defaults-to-monitor-not-nulllock: the NullLock flip still reds the concurrent unlocked-pin test in connection-pool.trails.test.ts"
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
`test-helpers/models/contact.ts:9`. `withConnectionSync` is also read by
`Relation#loadAsync` (`relation.ts:455-456`).

This is a convergence, not a language shortcoming. `model-schema.ts:604-611`
records that the lease is permanent and trips
`permanent_connection_checkout = :deprecated | :disallowed` on every save. That
flag was armed in the AR suite by trails#7781. Rails' pool reads never take a
permanent lease.

The earlier blocker named `abstract-adapter-lock-defaults-to-monitor-not-nulllock`.
It does not apply, because nothing here touches the adapter lock.

## Acceptance criteria

- `reflectionAdapter` and `AliasTracker.create` get their connection from a
  `withConnection` scope, as Rails' pool read and `alias_tracker.rb:10` do.
  Neither takes a permanent lease.
- `migrationConnection` and the deprecated `connection` getter keep their Rails
  names and resolve through the async lease. The PR settles the RFC's open
  question (return the awaited lease, or answer only a threaded
  `activeConnection` and raise otherwise), with caller counts for both options.
- `leaseConnectionSync` and `withConnectionSync` have 0 definitions and 0 callers
  under `packages/`, including the test-infrastructure callers above.
- The AR suite is green on sqlite3, postgresql and mysql2 with
  `permanent_connection_checkout = :disallowed`.
- `scripts/stale-story-references.test.ts` stays green.
