---
rfc: "0146-exclusive-connection-leasing"
title: "Exclusive connection leasing and a connect path that finishes before hand-out"
status: active
created: 2026-09-10
updated: 2026-09-10
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
safe. The unit of exclusivity is the trails analogue of a Ruby thread — the
execution context, per `withExecutionContext`, not an isolated-state run.

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
   **Result (main `15627671d`):** with the `lock` field defaulted to `NullLock`
   (`abstract_adapter.rb:157`, `else` arm `:181-192`), all four cases fail on
   `ARCONN=postgresql` and `ARCONN=sqlite3_mem`: 4 failed / 26 passed, against
   30/30 without the patch. The four are
   `postgresql-adapter.exec-query.trails.test.ts` "reads currval on the session
   that ran its own INSERT", plus these three in
   `abstract-adapter.lifecycle.trails.test.ts`: "withRawConnection serializes
   concurrent calls and yields the connection", "reconnectBang serializes
   concurrent callers", and "verifyBang serializes concurrent callers and
   promotes the unconfigured connection once". #7288 and #7056 only order waiters
   _across_ execution contexts. `connectionLease()`
   (`abstract/connection-pool.ts:924-929`) keys the lease on
   `executionContextId()`, which is `0` for all unscoped code
   (`connection-pool/execution-context.ts:20-21`). So concurrent promises in
   _one_ flow share one leased adapter and still enter it concurrently. Phase 2
   is sized at full scope: nothing it assumed is already delivered, and both
   dependent stories stay blocked on it.
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
   pool is where Rails puts it and is the recommendation. Phase 1 showed the
   pool's per-context lease is already in place; what it lacks is exclusion
   between concurrent promises _within_ a context, so Phase 2 must add that
   there.

## Changelog

- 2026-09-10: initial RFC
- 2026-09-10: Phase 1 measured; #7288/#7056 do not prevent intra-flow
  concurrent entry
