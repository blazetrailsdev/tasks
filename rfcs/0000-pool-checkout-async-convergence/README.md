---
rfc: "0000-pool-checkout-async-convergence"
title: "Converge the synchronous pool-checkout seams onto the async checkout"
status: draft
created: 2026-09-16
updated: 2026-09-16
owner: "@deanmarano"
packages:
  - activerecord
clusters:
  - connection-lease
related-rfcs:
  - "0073-permanent-connection-checkout-disallowed"
  - "0147-execution-context-at-thread-spawn-sites"
  - "0150-sync-schema-reflection-readers"
---

<!-- Unnumbered until merge: keep `rfc:` as 0000-pool-checkout-async-convergence
     and the H1 below number-free. `scripts/finalize-rfc.mjs` swaps 0000 for the
     assigned number at merge. -->

# RFC — Converge the synchronous pool-checkout seams onto the async checkout

## Summary

trails' `ConnectionPool#checkout` is async because it awaits the per-checkout
`verifyBang`. Three pool seams still take a connection synchronously anyway: a
permanent sync lease (`leaseConnectionSync`), a sync acquire in the
exclusive-access sweep (`acquireConnectionSync`), and a `Queue#poll` that can
return a promise or a connection. Unlike the schema-cache readers, which are
being ratified as a language shortcoming, these three are not forced by the
language. They are a Rails divergence, and one of them now works against the
`permanent_connection_checkout` flag that trails#7781 armed. This RFC converges
them.

## Motivation

The 2026-09-15 triage audit
(`audits/active-rfc-open-stories-20260915T145633Z.md`, group A) put 22 blocked
sync/async stories in one bucket. They split three ways:

- The `toSql`, deferred-ids and acquisition-seam rows are already covered by
  CLAUDE.md § "`Relation` is evaluated by an async query".
- The seven schema-cache reader rows are being ratified in a CLAUDE.md section
  of their own (RFC 0150's decision).
- **The pool-checkout rows converge, and this RFC owns them.**

They are not ratifiable because Rails never needs them. Rails' `schema_cache` is
a pool read (`model_schema.rb:591`), and `AliasTracker.create` takes
`pool.with_connection` (`associations/alias_tracker.rb:10`). Neither checks a
connection out permanently. trails' `leaseConnectionSync` does, and the
`loadSchemaFromAdapter` JSDoc (`model-schema.ts:604-611`) says that this lease is
permanent and trips `permanent_connection_checkout = :deprecated | :disallowed`
on every save. So each sync caller that reaches it either works around a flag
Rails honours or trips it. The flag was armed in the AR suite by trails#7781.

These stories sat in `0123-blocked-convergence-holding` with a stale reason:
they were said to wait on the NullLock default
(`abstract-adapter-lock-defaults-to-monitor-not-nulllock`). None of them touch
the adapter lock. What blocks them is the async checkout itself, and no story
owned converging it.

## Seam inventory

Measured on trails `0236d460b2`.

### 1. The permanent sync lease

`ConnectionPool#leaseConnectionSync`
(`connection-adapters/abstract/connection-pool.ts:396-411`) is the sync twin of
`lease_connection` (`connection_pool.rb:315`). It pins the pool's
`_pinnedConnection` or runs `checkoutAndVerify(acquireConnectionSync(...))`, and
never awaits the `verifyBang` that the async `leaseConnection` gets through
`checkout` (`connection_pool.rb:547`). `withConnectionSync` (`:417-457`) is the
same arm for `with_connection` (`connection_pool.rb:405`).

Production callers:

| trails site                                          | Rails counterpart                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------ |
| `model-schema.ts:29` `reflectionAdapter`             | `schema_cache` pool read (`model_schema.rb:591`)                   |
| `connection-handling.ts:341` deprecated `connection` | `ConnectionHandling#connection` (`connection_handling.rb:274-290`) |
| `associations/alias-tracker.ts:70` `create`          | `pool.with_connection` (`alias_tracker.rb:10`)                     |
| `tasks/database-tasks.ts:884` `migrationConnection`  | `migration_class.lease_connection` (`database_tasks.rb:533-535`)   |

Callers in test infrastructure, which retire in the same pass:
`test-fixtures/fixture-connection.ts:8`,
`test-fixtures/with-transactional-fixtures.ts:164`, `test-helpers/models/contact.ts:9`.

`withConnectionSync` is also read by `Relation#loadAsync` (`relation.ts:455-456`).

### 2. The synchronous exclusive-access acquire

`checkoutForExclusiveAccess` (`connection-pool.ts:1045-1047`) calls
`pool.acquireConnectionSync(checkoutTimeout)`, where Rails'
`checkout_for_exclusive_access` calls `checkout(checkout_timeout)`
(`connection_pool.rb:802-803`). It is reached from
`attemptToCheckoutAllExistingConnections` (`:1010`) inside
`withExclusivelyAcquiredAllConnections`, whose block is synchronous. So the
acquired connection skips `checkout_and_verify` (`connection_pool.rb:942`), and
the timeout is raised from a different site than Rails'.

`acquireConnectionSync` itself (`connection-pool.ts:548-560`) polls with no
timeout and carries `@noRailsEquivalent PERMANENT`. That receipt is wrong: Rails
has one `acquire_connection` (`connection_pool.rb:862`), and this RFC retires
the sync twin.

### 3. The promise arm in `Queue#poll`

`Queue#poll` (`connection-pool/queue.ts:179-183`) is overloaded to answer
`DatabaseAdapter | undefined` without a timeout and
`Promise<DatabaseAdapter> | DatabaseAdapter` with one, because `waitPoll`
(`:214`) is async where Ruby's `wait_poll` (`queue.rb:111`) blocks.
`ConnectionLeasingQueue#internalPoll` (`queue.ts:243-257`) therefore probes
`then` to decide where to `lease`, where Rails has three lines
(`queue.rb:202-206`). The pool casts the no-timeout arm back at
`connection-pool.ts:1103,1108`.

### 4. The receipts that retire with it

`sync-reads-of-async-reflection-retire-with-rfc-0073` is the receipt story for
this surface. It is cited by:

- `@noRailsEquivalent CONVERGEABLE` in `connection-pool.ts:269`
  (`adapterReady`), `:394` (`leaseConnectionSync`), `:415`
  (`withConnectionSync`), `:672` (`discardBangDraining`) and `:791`
  (`drainPendingCloses`), and in `abstract-adapter.ts:1269`
  (`internalSchemaCache`);
- `@missingRailsCall with_connection` in `relation.ts:454,672,994` and
  `relation/query-methods.ts:1298`;
- `@missingRailsArgs where_sql` in `relation/finder-methods.ts:339`.

The `abstract-adapter.ts:1269` schema-cache slot and the `relation*` sites
overlap the two ratified CLAUDE.md sections. As each section lands, the story
converts the tags it covers to `PERMANENT` against that section, and keeps
converging the rest here.

## Design

**Target:** no synchronous checkout path. A connection comes from `checkout`,
`leaseConnection` or `withConnection`, each awaited. Where Rails reads the pool
(`schema_cache`, `with_connection`), trails reads the pool too, and never takes a
permanent lease to do it.

1. **Callers take the Rails-shaped path.**
   - `reflectionAdapter` becomes a `withConnection` scope at the pool-read site,
     as `loadSchemaFromAdapter` already does.
   - `AliasTracker.create` takes a connection. Its caller (`relation.ts:1560`) is
     already inside a `withConnection` scope, or is moved into one, matching
     `alias_tracker.rb:10`.
   - `migrationConnection` and the deprecated `connection` getter keep their
     Rails names and resolve the lease through the async surface (see Open
     questions).
   - Once `leaseConnectionSync` / `withConnectionSync` have no caller, both are
     deleted.
2. **The exclusive sweep awaits `checkout`.**
   - `checkoutForExclusiveAccess` becomes `await checkout(checkoutTimeout)`.
   - `attemptToCheckoutAllExistingConnections` and
     `withExclusivelyAcquiredAllConnections` become async, so `disconnect`,
     `discard!` and `clear_reloadable_connections` await the sweep.
   - `acquireConnectionSync` is deleted.
   - Per CLAUDE.md § "The pool monitor guards only sections that span an
     `await`", a body that gains an `await` gains the monitor in the same
     change. The three sweep bodies listed there as "not wrapped" move onto
     `synchronize` here.
3. **`Queue#poll` has one shape.** With no sync acquirer left, every
   `poll(timeout)` caller awaits. `poll` returns
   `Promise<DatabaseAdapter | undefined>`, `internalPoll` is Rails' three lines,
   and the overloads and `as` casts go.
4. **Receipts retire.** Each member cited by
   `sync-reads-of-async-reflection-retire-with-rfc-0073` is deleted with its
   receipt, or re-cited `PERMANENT` against a ratified CLAUDE.md section. No
   `CONVERGEABLE` citation of that story remains.

## Non-goals

- **Schema-cache sync readers** (`getCachedColumnsHash` and its siblings): these
  are ratified in CLAUDE.md, not converged.
- **`Relation#toSql`, `DeferredIdsIn` and the thenable**: already ratified by
  § "`Relation` is evaluated by an async query".
- **The adapter NullLock default and same-context serialization**: handled by
  RFC 0147 and `abstract-adapter-null-lock-breaks-concurrent-async-statements`.
  This RFC neither waits on them nor changes the adapter lock.

## Alternatives considered

- **Ratify `leaseConnectionSync` with the schema-cache readers.** Rejected. The
  permanent lease trips a Rails flag that Rails' own pool read never trips, so
  this is a fidelity bug rather than a language shortcoming.
- **Make `leaseConnectionSync` non-permanent.** Rejected. It is still a second
  checkout path that skips `verifyBang`, and nothing in Rails matches it.

## Rollout

1. `converge-sync-connection-lease-per-checkout-verify`: Design §1.
2. `converge-connection-pool-lifecycle-exclusive-access-async`: Design §2.
   Independent of phase 1.
3. `connection-leasing-queue-internal-poll-carries-a-promise-arm`: Design §3.
   Depends on both.
4. `sync-reads-of-async-reflection-retire-with-rfc-0073`: Design §4. Depends on
   1–3.

All four stories exist in `0123-blocked-convergence-holding` and are rehomed
here after this RFC merges, from the main worktree:

```sh
tasks rehome converge-sync-connection-lease-per-checkout-verify \
  converge-connection-pool-lifecycle-exclusive-access-async \
  connection-leasing-queue-internal-poll-carries-a-promise-arm \
  sync-reads-of-async-reflection-retire-with-rfc-0073 --to <assigned-rfc>
```

## Verification

- `leaseConnectionSync`, `withConnectionSync` and `acquireConnectionSync` have 0
  definitions and 0 callers under `packages/`.
- `Queue#poll` has one signature, and `queue.ts` contains no `.then ===
"function"` probe.
- `git grep "CONVERGEABLE sync-reads-of-async-reflection-retire-with-rfc-0073"`
  returns 0 hits.
- The AR suite stays green on all three adapters with
  `permanent_connection_checkout = :disallowed` (trails#7781). No schema load
  or join-alias build trips it.

## Open questions

1. **What do the sync Rails APIs whose whole job is a lease return?** These are
   `ConnectionHandling#connection` and `DatabaseTasks.migration_connection`. One
   option is to return the awaited lease, which changes the return type to a
   Promise under the same name. The other is to answer only an
   already-threaded `activeConnection` and raise `ConnectionNotEstablished`
   otherwise. **Deferred to
   `converge-sync-connection-lease-per-checkout-verify`**, which measures the
   callers of each before choosing.

## Changelog

- 2026-09-16: initial RFC, from the 2026-09-15 triage audit's group A split
