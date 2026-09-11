---
rfc: "0146-exclusive-connection-leasing"
title: "Exclusive connection leasing and a connect path that finishes before hand-out"
status: closed
created: 2026-09-10
updated: 2026-09-11
owner: "@deanmarano"
packages:
  - "activerecord"
  - "arel"
clusters: []
priority: 2
---

# RFC 0146 — Exclusive connection leasing and a connect path that finishes before hand-out

## Summary

Six stories in RFC 0119 are blocked on one fact: **trails never leases an
adapter to a single logical flow the way Ruby leases a connection to a single
thread, and it hands an adapter out before its connect/configure path has
finished.** Every one of the six was written as a local convergence, hit that
fact, and stopped. This RFC makes the fact itself the unit of work.

## Motivation

Rails gets two guarantees for free that trails does not have:

1. **A leased connection is entered by one thread.** `ConnectionPool#lease` hands
   the connection to a thread and no other thread touches it, so
   `abstract_adapter.rb:157` can default `@lock` to `NullLock` and
   `postgresql/database_statements.rb:45-61` can issue a non-returning
   `exec_insert` as two separate unlocked statements.
2. **`connect` has completed when the adapter is handed out.** `verify!`
   (`abstract_adapter.rb:759`), `get_database_version`'s `query_value`, and the
   server-version memo all run on an already-connected raw handle, and Ruby's
   `Monitor` is reentrant.

trails has neither, and the six blocked stories are the six places that shows.

### What the blocked stories measured

- **`abstract-adapter-lock-defaults-to-monitor-not-nulllock`** — converging the
  default to `NullLock` reds
  `postgresql-adapter.exec-query.trails.test.ts:322` ("reads currval on the
  session that ran its own INSERT"): with the monitor gone, two concurrent
  `execInsert` calls on one adapter interleave their INSERT and their `currval`
  probe. The monitor is standing in for exclusive leasing.
- **`server-version-barrier-takes-the-connection-lock-first`** — deleting the two
  `connection.lock.synchronize(...)` wrappers (`pool-config.ts:84`,
  `abstract/connection-pool.ts:98`) reinstates the #7592 A/B lock inversion for
  the same reason.
- **`converge-sync-connection-lease-per-checkout-verify`** — `verifyBang`
  (`connection-adapters/abstract-adapter.ts:1131`) is async where Rails'
  `verify!` is sync, while the pool interface still declares
  `verifyBang(): void` (`abstract/connection-pool.ts:38`). Neither arm of its
  acceptance criteria is reachable.
- **`connection-leasing-queue-internal-poll-carries-a-promise-arm`** —
  `Pool#acquireConnectionSync` (`abstract/connection-pool.ts:584`) calls
  `this._available.poll()` synchronously and returns a `DatabaseAdapter`, feeding
  `checkoutForExclusiveAccess` and the lease site; an always-async `internalPoll`
  breaks both.
- **`converge-sql-for-insert-and-supports-insert-returning-to-sync`** — the
  connect path fires `configureConnection()` without awaiting it
  (`sqlite3-adapter.ts:290`, `void this.configureConnection()`), so the pool's
  `_serverVersion` memo (`pool-config.ts:81`) is cold on the first `execInsert`
  and a sync `supportsInsertReturning()` throws
  `this.databaseVersion.compare is not a function`.
- **`sqlite-get-database-version-uses-query-value`** — routing the probe through
  `queryValue` deadlocks the SQLite lane for 30s, because it becomes a pooled,
  lock-taking query issued from _inside_ `configureConnection` while
  `checkVersion` and `supportsVirtualColumns` re-enter `databaseVersion` behind
  the held monitor. Rails has no such cycle.

### Two of the three named prerequisites have already landed

`abstract-adapter-lock-defaults-to-monitor-not-nulllock` says unblocking "needs
the pool to prevent concurrent entry on a leased connection — see
`synchronize-lock-barges-in-the-release-window` and
`converge-acquire-connection-blocking-wait`". Both are **done** — PRs 7288 and
7056 — but Phase 1 measured that they do **not** deliver the guarantee (see
Rollout).

## Design

Two mechanisms, in order.

### 1. A leased adapter is entered by one logical flow

Establish, in the pool rather than in the adapter, that a checked-out adapter
cannot be re-entered concurrently. This is what lets `@lock` default to
`NullLock` (Rails' shape) instead of a monitor that exists to paper over shared
entry, and what makes the non-returning `exec_insert` two-statement sequence
safe. The unit of exclusivity is the trails analogue of a Ruby thread: one
sequential async flow. The execution context from `withExecutionContext` is
necessary but not sufficient. Phase 1 measured that promises fanned out
concurrently _inside_ one context (`Promise.all`) share its lease and enter the
adapter together, and a Ruby thread can never do that. So the lease must also
exclude a second concurrent entrant from the same context: it waits its turn at
the pool, not at the adapter's `@lock`.

### 2. Connect and configure complete before the adapter is handed out

`configureConnection()` is awaited on the connect path, so the server-version
and type memos are warm before any caller can issue a query. That removes the
`void this.configureConnection()` shortcut, the cold `_serverVersion` memo, and
the re-entrancy deadlock in one change, and is the precondition for
`supportsInsertReturning()`, `getDatabaseVersion` and `verifyBang` taking their
Rails shapes.

## Non-goals

- **Making `Arel::Nodes::Node#to_sql` async.** The blocker text on
  `converge-sync-connection-lease-per-checkout-verify` calls for it and cites
  "600+ call sites"; the real count is **24 non-test call sites** today
  (`packages/arel/src/nodes/node.ts:31`). It is out of scope here because
  exclusive leasing plus an awaited connect path may remove the need entirely —
  revisit only if a residual survives both mechanisms.
- **The PG/MySQL on-demand type lookups.** Separate root cause, separate RFC
  (`0000-async-on-demand-adapter-lookups`).

## Alternatives considered

- **Keep the connection monitor permanently and ratify it.** Rejected: it is a
  deviation register entry, not a language shortcoming — Rails' `NullLock`
  default is reachable once leasing is exclusive.
- **Make the sync spine async instead** (`leaseConnectionSync`,
  `acquireConnectionSync`, `Queue#poll`). Rejected as the primary route: it
  spreads async through six non-test call sites of `leaseConnectionSync` and
  into `to_sql`, and moves trails _away_ from Rails' shape, where all of these
  are synchronous.

## Rollout

1. Phase 1 — measure what #7288 and #7056 already guarantee; re-test
   `abstract-adapter-lock-defaults-to-monitor-not-nulllock` against main.
   **Result (trails main `15627671d`):**
   - _Patch:_ the `lock` field defaulted to `NullLock`
     (`abstract_adapter.rb:157`, `else` arm `:181-192`), applied locally only.
   - _Runs:_ on both `ARCONN=postgresql` and `ARCONN=sqlite3_mem`, the two test
     files go from 30/30 passing to 4 failed / 26 passed.
   - _Failing cases:_ `postgresql-adapter.exec-query.trails.test.ts` "reads
     currval on the session that ran its own INSERT", and these three in
     `abstract-adapter.lifecycle.trails.test.ts`: "withRawConnection serializes
     concurrent calls and yields the connection", "reconnectBang serializes
     concurrent callers", "verifyBang serializes concurrent callers and
     promotes the unconfigured connection once".
   - _Residual path:_ #7288 and #7056 only order waiters _across_ execution
     contexts. `connectionLease()` (`abstract/connection-pool.ts:924-929`) keys
     the lease on `executionContextId()`, which is `0` for all unscoped code
     (`connection-pool/execution-context.ts:20-21`). Concurrent promises in one
     flow therefore share one leased adapter and enter it together.
   - _Consequence:_ Phase 2 keeps its full scope. Both
     `abstract-adapter-lock-defaults-to-monitor-not-nulllock` and
     `server-version-barrier-takes-the-connection-lock-first` stay blocked, and
     their `blocked-by` now names this residual.
2. Phase 2 — exclusive entry on a leased adapter; then the `NullLock` default
   and `server-version-barrier-takes-the-connection-lock-first`.
3. Phase 3 — await `configureConnection` on the connect path; then
   `sqlite-get-database-version-uses-query-value` and
   `converge-sql-for-insert-and-supports-insert-returning-to-sync`.
4. Phase 4 — `converge-sync-connection-lease-per-checkout-verify` and
   `connection-leasing-queue-internal-poll-carries-a-promise-arm` as residuals.

## Verification

RFC 0119's blocked count drops by 6. `verifyBang` matches
`abstract_adapter.rb:759`'s sync signature and the `verifyBang(): void`
declaration at `abstract/connection-pool.ts:38` is honest. No
`connection.lock.synchronize` wrapper remains at `pool-config.ts:84` or
`abstract/connection-pool.ts:98`, and `@lock` defaults to `NullLock`.

## Open questions

1. **Does exclusive leasing land in the pool or in the execution context?** The
   **Answered by Phase 1: in the pool.** The per-context lease
   (`connectionLease()`) already exists. What it lacks is exclusion between
   concurrent promises _within_ one context, and Phase 2 adds that to the
   pool's lease, not to the adapter (see Design §1).

## Closure

Closed 2026-09-11 with its Verification target **unmet**. Phase 1 and the two
stories that followed it landed:

- `measure-what-exclusive-leasing-already-guarantees` (tasks#94) — established
  that PRs 7288 and 7056 are insufficient, with the 4-failed/26-passed runs on
  both lanes recorded in Rollout above.
- `express-adapter-concurrency-tests-at-the-pool-level` (trails#7672).
- `lease-identity-must-not-collapse-to-context-zero`.

The six convergence stories this RFC was opened to unblock were **not**
converged. They are parked, still blocked, in `0123-blocked-convergence-holding`:
`abstract-adapter-lock-defaults-to-monitor-not-nulllock`,
`server-version-barrier-takes-the-connection-lock-first`,
`converge-sync-connection-lease-per-checkout-verify`,
`connection-leasing-queue-internal-poll-carries-a-promise-arm`,
`converge-sql-for-insert-and-supports-insert-returning-to-sync`,
`sqlite-get-database-version-uses-query-value`.

So the stated Verification — RFC 0119's blocked count down by 6, `@lock`
defaulting to `NullLock`, no `connection.lock.synchronize` wrapper at
`pool-config.ts:84` or `abstract/connection-pool.ts:98` — still describes work
that has not happened. Reopening this RFC is not the way back to it; whoever
takes the holding-RFC stories files a fresh RFC with the Phase 1 measurement
above as its starting evidence.

## Changelog

- 2026-09-10: initial RFC
- 2026-09-10: Phase 1 measured; #7288/#7056 do not prevent intra-flow
  concurrent entry. Design §1 narrowed from "execution context" to one
  sequential flow; Open question 1 answered (in the pool).
- 2026-09-11: closed; six convergence stories parked in 0123-blocked-convergence-holding
