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
language: each has a Rails-shaped replacement that trails already has. They are a Rails divergence, and one of them now works against the
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
`checkout` (`connection_pool.rb:547`).

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

`withConnectionSync` is a different case. Rails' `with_connection` checks out
for the block and releases it afterwards unless the lease is sticky
(`connection_pool.rb:405-421`), and `withConnectionSync` does the same. Its
callers are synchronous because Rails' are: `Relation#arel`
(`relation/query-methods.ts:1302`), `execMainQuery` and `loadAsync`
(`relation.ts:456,686,698`), `find_with_ids` (`relation.ts:1030`,
`relation/finder-methods.ts:355`), `attributes.ts:85` and `base.ts:3157`. Those
callers fall under CLAUDE.md § "`Relation` is evaluated by an async query". The
one thing it lacks against Rails is the awaited `verifyBang`. **So
`withConnectionSync` is the sync scope this RFC converges callers onto, not a
seam it deletes.**

### 2. The synchronous exclusive-access acquire

`checkoutForExclusiveAccess` (`connection-pool.ts:1045-1047`) calls
`pool.acquireConnectionSync(checkoutTimeout)`, where Rails'
`checkout_for_exclusive_access` calls `checkout(checkout_timeout)`
(`connection_pool.rb:802-803`). It is reached from
`attemptToCheckoutAllExistingConnections` (`:1010`) inside
`withExclusivelyAcquiredAllConnections`, whose block is synchronous. So the
acquired connection skips `checkout_and_verify` (`connection_pool.rb:942`), and
the timeout is raised from a different site than Rails'.

`acquireConnectionSync` itself (`connection-pool.ts:548-560`) is the no-wait
half of `acquire_connection` (`connection_pool.rb:862-880`): the two
`@available.poll || try_to_checkout_new_connection` attempts, without the final
`@available.poll(checkout_timeout)` wait. It stays, because it backs
`withConnectionSync`. What this RFC fixes is the receipt: its bare
`@noRailsEquivalent PERMANENT` becomes a citation of the Relation section,
which is the reason it is permanent.

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

**Target:** no permanent lease that Rails does not take, and no sync acquire
outside the sync `with_connection` scope. A caller gets its connection one of two
ways:

- from `checkout` / `leaseConnection` / `withConnection`, awaited, where its
  Rails body can be reached from async code;
- from `withConnectionSync`, whose lease is released after the block, where its
  Rails body is on the synchronous `arel` / `to_sql` path that the Relation
  section ratifies.

1. **Retire the permanent sync lease.**
   - `reflectionAdapter` (`model-schema.ts:29`) and `AliasTracker.create`
     (`alias-tracker.ts:70`) take `pool.withConnectionSync`. This is exactly
     `alias_tracker.rb:10`'s `pool.with_connection`, and Rails'
     `schema_cache` pool read. `AliasTracker.create` stays synchronous, because
     its callers (`relation/query-methods.ts:2449`,
     `associations/association-scope.ts:104`) build arel synchronously.
   - `migrationConnection` and the deprecated `connection` getter keep their
     Rails names; see Open question 1.
   - The test-infrastructure callers move with them, and `leaseConnectionSync`
     is deleted.
2. **The exclusive sweep awaits `checkout`.**
   - `checkoutForExclusiveAccess` becomes `await this.checkout(checkoutTimeout)`.
   - `attemptToCheckoutAllExistingConnections` and
     `withExclusivelyAcquiredAllConnections` become async, so `disconnect`,
     `discard!` and `clear_reloadable_connections` await the sweep.
   - Per CLAUDE.md § "The pool monitor guards only sections that span an
     `await`", a body that gains an `await` gains the monitor in the same
     change. The sweep bodies that section lists as "not wrapped" move onto
     `synchronize`, and the section is updated in the same PR.
3. **`Queue#poll` loses its duck-typed promise arm.** The no-timeout `poll()` is
   non-blocking in Rails (`queue.rb:71-78`, `no_wait_poll`) and stays
   synchronous for `acquireConnectionSync`. The timeout arm is only reached from
   the async acquire, so `poll(timeout)` always returns a promise. `internalPoll`
   then branches on the argument, not on a `then` probe, and the `as` casts at
   `connection-pool.ts:1103,1108` go. Whether it can reach Rails' literal three
   lines is Open question 2.
4. **Receipts retire.** Each member cited by
   `sync-reads-of-async-reflection-retire-with-rfc-0073` is either deleted with
   its receipt, or re-cited `PERMANENT` against a ratified CLAUDE.md section.
   `withConnectionSync` and the `relation*` `@missingRailsCall with_connection`
   tags go to the Relation section. `internalSchemaCache` goes to the
   schema-cache section. No `CONVERGEABLE` citation of that story remains.

## Non-goals

- **Schema-cache sync readers** (`getCachedColumnsHash` and its siblings): these
  are ratified in CLAUDE.md, not converged.
- **`Relation#toSql`, `DeferredIdsIn` and the thenable**: already ratified by
  § "`Relation` is evaluated by an async query".
- **Making `withConnectionSync` async.** Its callers are the sync `arel` /
  `to_sql` path, which is ratified. Converging them is a change to that
  section, not to this RFC.
- **The adapter NullLock default and same-context serialization**: handled by
  RFC 0147 and `abstract-adapter-null-lock-breaks-concurrent-async-statements`.
  This RFC neither waits on them nor changes the adapter lock.

## Alternatives considered

- **Ratify `leaseConnectionSync` with the schema-cache readers.** Rejected. The
  permanent lease trips a Rails flag that Rails' own pool read never trips, so
  this is a fidelity bug rather than a language shortcoming.
- **Make `leaseConnectionSync` non-permanent.** Rejected. That would just be
  `withConnectionSync` under a name that says `lease_connection`, whose Rails
  semantics are a permanent lease.
- **Delete every sync acquire, `withConnectionSync` included.** Rejected, because
  it needs async `arel`, which is ratified as out of reach (see Non-goals). The
  first draft of this RFC proposed it.

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

- `leaseConnectionSync` has 0 definitions and 0 callers under `packages/`.
- `acquireConnectionSync` has exactly one caller, `withConnectionSync`
  (`connection-pool.ts:448` today). The exclusive-access sweep has none.
- `queue.ts` contains no `then` probe, and `connection-pool.ts` no
  `poll() as DatabaseAdapter` cast.
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
2. **Can `ConnectionLeasingQueue#internalPoll` be Rails' three lines?** Rails
   leases after `super` returns a connection. With a promise-returning timeout
   arm, the lease has to run after the promise settles, which is a second arm.
   One option is to make `waitPoll`'s resolution go through the same lease site,
   for example an async `internalPoll` that awaits `super`. **Deferred to
   `connection-leasing-queue-internal-poll-carries-a-promise-arm`.** If no
   single-arm shape exists, that story blocks with the measured reason. It does
   not ratify.

## Changelog

- 2026-09-16: initial RFC, from the 2026-09-15 triage audit's group A split
- 2026-09-16: self-review. `withConnectionSync` and `acquireConnectionSync` are
  kept as the sync `with_connection` scope, because their callers are the
  ratified sync arel path, and `AliasTracker.create` moves onto that scope rather
  than going async. Added Open question 2.
