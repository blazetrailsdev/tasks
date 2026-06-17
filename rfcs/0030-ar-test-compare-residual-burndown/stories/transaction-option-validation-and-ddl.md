---
title: "transaction() option-key validation + DDL-in-transaction"
status: in-progress
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: 27
pr: 3510
claim: "2026-06-16T23:36:41Z"
assignee: "transaction-option-validation-and-ddl"
blocked-by: null
---

## Context

Two small transaction-surface gaps (transactions.test.ts):

1. `transaction()` does not validate option keys, so `transaction({ nested: true })`
   silently succeeds. Rails raises `ArgumentError` for unknown keys
   (transactions.ts ~ `withTransactionReturningStatus`/transaction entry). Blocks
   `invalid keys for transaction` (rails transactions_test.rb:902).

2. DDL-in-transaction: `add_column` / `remove_column` + `reset_column_information`
   on the connection are not exercised at the test layer for the SQLite
   DDL-transaction path. Blocks `sqlite add column in transaction`
   (rails transactions_test.rb:1360, gated `supports_ddl_transactions?`).

## Acceptance criteria

- [x] `transaction()` raises on unknown option keys (matching Rails ArgumentError).
- [x] `add_column`/`remove_column`/`reset_column_information` work inside a
      transaction on SQLite; both tests un-skipped and pass; no new gate-mismatches.
