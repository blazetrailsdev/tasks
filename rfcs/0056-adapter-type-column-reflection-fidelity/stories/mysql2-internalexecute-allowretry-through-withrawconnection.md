---
title: "Route mysql2 internalExecute through withRawConnection so beginDbTransaction threads allowRetry (Rails single-call shape)"
status: ready
updated: 2026-07-01
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by PR #4356 (story
`adapter-reconnect-restore-transaction-rematerialization`). Rails' mysql2
`begin_db_transaction` / `begin_isolated_db_transaction`
(`abstract_mysql_adapter.rb:227-233`) are single calls:
`internal_execute("BEGIN", "TRANSACTION", allow_retry: true,
materialize_transactions: false)`. In trails, mysql2's `internalExecute`
(`mysql2-adapter.ts:~959`) does NOT go through `withRawConnection` — it calls
`getConn()` + `mysql2PerformQuery` directly with no retry/verify/reconnect loop
and accepts only `{ materializeTransactions }` (no `allowRetry`). Consequently
`beginDbTransaction` (PR #4356) had to wrap the `BEGIN` in an _outer_
`withRawConnection({ allowRetry: true, materializeTransactions: false })`,
reusing the same external-wrap shape `beginIsolatedDbTransaction` already uses,
rather than threading `allowRetry` in one call the way PG's `internalExecute`
does post-#4356.

PG converged this: `postgresql-adapter.ts internalExecute` accepts
`{ materializeTransactions, allowRetry }` and threads `allowRetry` into its
`withRawConnection` call, so PG's `beginDbTransaction`/`beginIsolatedDbTransaction`
match Rails' single-call shape. mysql2 should converge the same way.

Note the phase-2 story (`phase2-route-data-path-through-withrawconnection`, done,
PR #3074) routed `execute`/`executeMutation`/`execQuery` through
`withRawConnection`, but `internalExecute` (used by transaction-control SQL:
BEGIN/COMMIT/ROLLBACK/SAVEPOINT) was left on the direct `getConn` path — this
story finishes that convergence for the transaction-control seam.

## Acceptance criteria

- [ ] mysql2 `internalExecute` accepts an `allowRetry` option and runs its query
      through the abstract `withRawConnection` loop (matching PG's post-#4356
      `internalExecute`), so retry/verify/reconnect + `invalidateTransaction`
      are centralized rather than hand-rolled.
- [ ] `beginDbTransaction` threads `allowRetry: true` through `internalExecute`
      in a single call (dropping the external `withRawConnection` wrap added in
      #4356), matching Rails `abstract_mysql_adapter.rb:227`.
- [ ] `beginIsolatedDbTransaction` likewise threads `allowRetry` (it issues
      `SET TRANSACTION ISOLATION LEVEL` + `BEGIN` via `execute_batch`; keep the
      batch semantics, drop the redundant outer wrap where possible), matching
      `abstract_mysql_adapter.rb:231-239`.
- [ ] No regression in transaction-control SQL semantics (COMMIT/ROLLBACK/
      SAVEPOINT keep their `materializeTransactions: false` behavior and do not
      gain spurious `dirtyCurrentTransaction()` calls).
- [ ] `AdapterConnectionTest`, `transactions.test.ts`, and
      `transaction-instrumentation.test.ts` pass on MySQL/MariaDB.
