---
title: "savepoint-internalexecute-materialize-transactions-parent-dirty"
status: done
updated: 2026-07-07
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 45
pr: 4732
claim: "2026-07-07T12:37:51Z"
assignee: "savepoint-internalexecute-materialize-transactions-parent-dirty"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #4577 (story
`mysql2-internalexecute-allowretry-through-withrawconnection`). Rails' savepoint
statements — `create_savepoint`/`release_savepoint`/`exec_rollback_to_savepoint`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/savepoints.rb:11-20`)
— call `internal_execute("... SAVEPOINT ...", "TRANSACTION")` with the DEFAULT
`materialize_transactions: true`. Inside `with_raw_connection`
(`abstract_adapter.rb:983-1046`) that flag also gates
`ensure dirty_current_transaction if materialize_transactions` (line 1046),
which fires on every exit path.

For a nested RELEASE / ROLLBACK TO SAVEPOINT the committing/rolling-back
savepoint frame is popped by `TransactionManager#_commitTransactionInner`
(`transaction.ts:1108-1117`) BEFORE the SQL runs, so `currentTransaction`
points at the real PARENT frame. In Rails, if the raw savepoint SQL hits a
retryable/reconnect condition, the parent frame is marked dirty — so
`restore_transactions` / `isRestorable()` (`transaction.ts:1042-1047`, Rails
`transaction.rb:574` `@stack.none?(&:dirty?)`) correctly refuses to restore a
parent whose child savepoint op may have partially executed.

trails' mysql2 (and PG) savepoint methods pass `materializeTransactions: false`
into `internalExecute`, so this parent-dirtying never happens. This is a
long-standing deviation shared across the DatabaseStatements-on-adapter design
(both mysql2 and PG), pre-dating and out of scope for PR #4577 — that PR only
routed the savepoint calls through `withRawConnection` without changing their
`materializeTransactions` value.

## Acceptance criteria

- [ ] Decide whether `createSavepoint`/`releaseSavepoint`/`rollbackToSavepoint`
      on mysql2 and PG should thread `materializeTransactions: true` (matching
      Rails `savepoints.rb:11-20`) so the loop's `dirtyCurrentTransaction()`
      dirties the parent frame on a retryable savepoint failure — OR document
      why trails deliberately keeps `false` (e.g. re-entrant materialize during
      savepoint emission) as an accepted deviation.
- [ ] If converging: thread the flag through both adapters, keeping the
      materialize-outside-the-loop split intact (no double-materialize), and add
      a test asserting the parent frame becomes non-restorable after a
      reconnect mid-nested-savepoint-op.
- [ ] No regression in `transactions.test.ts` /
      `transaction-instrumentation.test.ts` on MySQL/MariaDB and PostgreSQL.
