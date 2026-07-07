---
title: "Add mysql2/PG live-adapter reconnect-mid-savepoint parent-dirty tests"
status: ready
updated: 2026-07-07
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up to PR #4732 (story
`savepoint-internalexecute-materialize-transactions-parent-dirty`), which
converged mysql2/PG/sqlite savepoint statements onto Rails' default
`materialize_transactions: true` and relocated Rails' `with_raw_connection`
`ensure dirty_current_transaction if materialize_transactions`
(`abstract_adapter.rb:1046`) into each adapter's `internalExecute` finally, so a
nested RELEASE / ROLLBACK TO SAVEPOINT dirties the popped frame's real PARENT.

The regression test added in #4732 lives in
`packages/activerecord/src/transactions.trails.test.ts` and exercises the
relocated finally on the **sqlite** adapter (success path dirties the parent;
a mocked mid-flight `driver.exec` rejection still dirties on the error path).
sqlite shares the exact `internalExecute` finally with mysql2/PG, so the
mechanism is covered — but the literal acceptance ask was for a **mysql2/PG**
test asserting the parent frame becomes non-restorable after a genuine
`reconnect!` mid-nested-savepoint-op driven through `withRawConnection`'s
retry/reconnect loop (a path sqlite does not have). That live-adapter test was
not written because it needs a real MySQL/PG connection plus fault injection
of a retryable `ConnectionFailed`, which is ARCONN-gated and not runnable in
the default sqlite CI job / local runs.

## Acceptance criteria

- [ ] Add a mysql2 and a PG test (ARCONN-gated, alongside the existing
      adapter transaction suites) that open an outer transaction + nested
      savepoint, force a retryable `ConnectionFailed` during the
      RELEASE/ROLLBACK TO SAVEPOINT so `withRawConnection` reconnects, and
      assert the parent frame is dirty → `transactionManager.isRestorable()`
      is `false` afterward.
- [ ] Confirm the relocated `internalExecute` finally
      (`dirtyCurrentTransaction()`) is what produces the dirty parent on the
      reconnect path, not the `withRawConnection` loop's own suppressed
      (`materializeTransactions: false`) finally.
- [ ] No regression in `transactions.test.ts` /
      `transaction-instrumentation.test.ts` on MySQL/MariaDB and PostgreSQL.
