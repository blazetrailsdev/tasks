---
title: "rawConnection materializes txn + disables lazy transactions"
status: claimed
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 25
pr: null
claim: "2026-06-16T23:12:42Z"
assignee: "raw-connection-materializes-transactions"
blocked-by: null
---

## Context

`rawConnection` is a plain getter that returns `_connection` with no side
effects (packages/activerecord/src/connection-adapters/abstract-adapter.ts:1401).
Rails' `raw_connection` materializes pending transactions and disables lazy
transactions for the connection. The lazy/materialize plumbing already exists
(`materializeTransactions` :1327, `disableLazyTransactionsBang` :1335,
`enableLazyTransactionsBang` :1339, `_rawConnectionDirty` :538).

Blocks un-skipping (transactions.test.ts):

- accessing raw connection materializes transaction (rails transactions_test.rb:1588)
- accessing raw connection disables lazy transactions (rails:1594)
- checking in connection reenables lazy transactions (rails:1602)

## Acceptance criteria

- [ ] Accessing `rawConnection` materializes any open transaction and disables
      lazy transactions (sets `_rawConnectionDirty`).
- [ ] Checking a connection back into the pool re-enables lazy transactions.
- [ ] The 3 tests above are un-skipped and pass; no new gate-mismatches.
