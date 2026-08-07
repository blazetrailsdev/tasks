---
title: "Retire _queryInFlightSettled/_queryInFlightOwner: cancel_any_running_query drains the connection, not adapter bookkeeping"
status: done
updated: 2026-08-07
rfc: "0085-pg-cancel-query-rails-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6189
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #6165 ported the `@raw_connection.block` half of `cancel_any_running_query`
(`activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb:127-128`)
by introducing a second invented field next to `_queryInFlightOwner`:

- `_queryInFlightSettled` (`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`,
  set in `_serializePinnedQuery`, read in `_cancelAnyRunningQuery`) — a
  never-rejecting promise derived from the in-flight query's own promise, which
  the cancel awaits in place of libpq's `PQconsumeInput`/`block` loop.

Rails needs neither field: `@raw_connection` is a real libpq handle, and
`block` drains the connection itself rather than a bookkeeping promise the
adapter kept. Both fields exist only because trails' per-async-chain lock lets a
query outlive the chain that issued it — the same root cause
`pg-retire-pinned-query-mutex` and `pg-lock-scope-no-escaping-queries` address.

A second, narrower gap rides along: the drain attaches handlers to the _inner_
`client.query` promise, so that promise's rejection is observed, but the outer
`_serializePinnedQuery`/`execute` promise still rejects into whatever chain
awaited it. A truly dropped chain can therefore still produce a run-end
unhandled rejection, and the regression test in #6165 asserts the drain
(`_queryInFlightOwner` is null when ROLLBACK is sent) rather than the absence of
that rejection — asserting the latter needs a `process.on("unhandledRejection")`
hook, which the repo's hard rules forbid.

## Converged shape

When the pinned-query mutex retires, `_cancelAnyRunningQuery` should be
`cancel` followed by a drain of the _connection_ (node-pg's client-level
settlement), with no per-query owner/settlement bookkeeping on the adapter —
i.e. both `_queryInFlightOwner` and `_queryInFlightSettled` deleted, and the
ownership guard in `_cancelAnyRunningQuery` deleted with them, so the method
reduces to Rails' two lines plus the `IDLE_TRANSACTION_STATUSES` guard.

Land this after (or with) `pg-retire-pinned-query-mutex`, whose removal is the
precondition.

## Acceptance criteria

- [ ] `_queryInFlightSettled` and `_queryInFlightOwner` are both gone from
      `postgresql-adapter.ts`.
- [ ] `_cancelAnyRunningQuery`'s body is the `IDLE_TRANSACTION_STATUSES` early
      return, `cancel`, `block`-equivalent drain, and the best-effort catch —
      nothing else.
- [ ] The #6165 regression test ("rollback drains the cancelled query before
      sending ROLLBACK") still passes, re-expressed without reaching for
      `_queryInFlightOwner`.
- [ ] The RFC 0061 `pg-query-canceled-unhandled-rejection` class stays closed on
      the PG lane.
