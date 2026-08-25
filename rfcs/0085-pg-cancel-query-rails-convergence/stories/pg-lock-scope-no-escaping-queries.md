---
title: "Hold the connection lock for the query's whole life; delete the owner token"
status: done
updated: 2026-08-07
rfc: "0085-pg-cancel-query-rails-convergence"
cluster: null
deps: ["pg-transaction-status-port"]
deps-rfc: []
est-loc: 400
priority: null
pr: 6171
claim: "2026-08-07T13:08:28Z"
assignee: "adapter-ddl-bodies-clear-schema-cache-rails-never-touches"
blocked-by: null
closed-reason: null
---

## Context

Rails' `@lock.synchronize` wraps the entire `with_raw_connection` body
(`activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:984`),
so a query cannot outlive the lock scope that issued it: at most one query is on
the wire per connection, and it belongs to the thread holding the lock. Every
`TransactionManager` critical section takes the same lock
(`abstract/transaction.rb:611` for `rollback_transaction`), which is why
`cancel_any_running_query` needs no ownership concept at all.

trails' lock is per async chain and reentrant (`abstract/transaction.ts`
`synchronize`, ~1225), which mirrors Rails' Monitor reentrancy correctly — but a
chain can _return_ while a query it launched is still awaiting, releasing the
lock with work on the wire. `currentLockToken`'s own docblock
(`abstract/transaction.ts` ~1195) states this. That leak is the root of the
whole invented cluster described in RFC 0085: `_queryInFlightOwner` exists only
to tell a foreign chain's in-flight query from one's own, a question Rails
cannot even ask.

Concretely, the fire-and-forget pattern under test in
`packages/activerecord/src/adapters/postgresql/postgresql-adapter.trails.test.ts`
("rollback cancels an in-flight query the same chain abandoned") is the shape to
eliminate: a query launched un-awaited inside `transactionManager.synchronize`
that survives the block.

## Acceptance criteria

- An enforced invariant that no query outlives the `withRawConnection` /
  `synchronize` scope that issued it — the lock is not released while a query it
  covers is still awaiting.
- Callers relying on the abandoned-query pattern are converted; enumerate them
  in the PR body (this is the sizing risk — split into follow-up stories via
  `pnpm tasks new` rather than growing past the 500 LOC ceiling).
- `_queryInFlightOwner` and the ownership branch of `_cancelAnyRunningQuery`
  (`postgresql-adapter.ts` ~2230) are deleted, leaving Rails' shape: nil check +
  `IDLE_TRANSACTION_STATUSES` gate (that gate arrives with
  `pg-transaction-status-port`).
- The existing cancel tests keep passing in their Rails-faithful form, or are
  replaced by ones that do not depend on abandoning a query.

## Notes

Non-goal: turning the per-chain lock into a global mutex. The granularity
mirrors Rails' Monitor; the divergence is the early release.
