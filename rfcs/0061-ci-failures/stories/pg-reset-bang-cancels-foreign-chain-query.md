---
title: "pg-reset-bang-cancels-foreign-chain-query"
status: done
updated: 2026-08-11
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6365
claim: "2026-08-11T16:00:44Z"
assignee: "red-0e79d1a4"
blocked-by: null
closed-reason: null
---

## Context

"Active Record PostgreSQL Tests" shards fail intermittently with EVERY test
passing and one run-end vitest `Unhandled Rejection: QueryCanceled: canceling
statement due to user request` (most recently main @0e79d1a4, run 31502791905,
shard 2 — 325 files / 6967 tests passed, `Errors 1 error`). The earlier story
`pg-query-canceled-unhandled-rejection` (PR #5655) removed the abandoned-query
shapes inside `exec_rollback_db_transaction`, but the flake recurs.

Root cause, reproduced deterministically: `PostgreSQLAdapter#resetBang`
(`connection-adapters/postgresql-adapter.ts:2739`) called
`_cancelAnyRunningQuery()` before its ROLLBACK. `resetBang` is sync and runs
OUTSIDE the connection lock (pool checkin/reap), so the CancelRequest lands on a
query a _different_ async chain has on the wire. When nothing is left to observe
that rejection — the test that issued it has finished — vitest reports it at run
end with no test attribution.

Rails' `reset!` (`postgresql_adapter.rb:371-381`) takes `@lock` and issues
`ROLLBACK` / `DISCARD ALL`; it never cancels. `cancel_any_running_query` is
reached only from `exec_rollback_db_transaction` / `exec_restart_db_transaction`
(`postgresql/database_statements.rb:79, :84`). The cancel in `resetBang` is a
trails invention.

## Acceptance criteria

- `resetBang` no longer fires a CancelRequest, so it cannot kill a query
  another async chain owns. node-pg queues the ROLLBACK behind the in-flight
  query on the same client, which is the ordering Rails gets from `@lock`.
- Regression test in `adapters/postgresql/postgresql-adapter.trails.test.ts`
  next to `rollback does not cancel a query issued by another chain`, verified
  to fail on baseline.

AMENDED 2026-08-11, with evidence, during review of PR #6365. This story
originally also required the reset body to run under
`transactionManager.synchronize` (Rails' single `@lock.synchronize`, and the
`reset!` / `synchronize` call-mismatch baseline row it would converge). That was
implemented and it DEADLOCKS: `withRawConnection`'s in-lock
`awaitRawConnectionReady()`, `_acquireFreshClient` and `verifyBang` all await
`_inFlightReset` while already holding the lock, so a lock-taking reset queues
behind a query waiting for the reset. A pre-lock drain (TOCTOU) and a
"do I hold the lock" guard were both tried and both still deadlocked, measured
against the regression test `a query holding the lock does not wait on a reset
queued behind it`. The lock scope, and the baseline row it converges, moved to
`pg-reset-body-under-one-lock`, which carries that evidence — this story ships
the cancel removal only, and leaves the lock scope exactly as main has it.

## Definition of done

Gates green: `parity:api:calls`, `parity:api:calls:args`, `typecheck`, `lint`;
PG suites (`adapters/postgresql/**`, `connection-adapters/**`, `adapter.test.ts`,
`transactions.test.ts`) green locally against PG 17.

## Verification

Deterministic repro: `beginDbTransaction`, put `SELECT pg_sleep(0.5)` on the
wire from another chain, call `resetBang()` — baseline rejects with
`QueryCanceled`, fixed resolves.
