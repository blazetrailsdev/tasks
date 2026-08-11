---
title: "pg-reset-bang-cancels-foreign-chain-query"
status: claimed
updated: 2026-08-11
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
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

- `resetBang` no longer fires a CancelRequest; the ROLLBACK runs under the same
  lock Rails takes (`transactionManager.synchronize`), so it waits behind an
  in-flight query instead of killing it.
- Regression test in `adapters/postgresql/postgresql-adapter.trails.test.ts`
  next to `rollback does not cancel a query issued by another chain`, verified
  to fail on baseline.
- The now-converged `reset!` / `synchronize` call-mismatch baseline row is
  deleted by hand and the per-file unreviewed mark tightened.

## Definition of done

Gates green: `parity:api:calls`, `parity:api:calls:args`, `typecheck`, `lint`;
PG suites (`adapters/postgresql/**`, `connection-adapters/**`, `adapter.test.ts`,
`transactions.test.ts`) green locally against PG 17.

## Verification

Deterministic repro: `beginDbTransaction`, put `SELECT pg_sleep(0.5)` on the
wire from another chain, call `resetBang()` — baseline rejects with
`QueryCanceled`, fixed resolves.
