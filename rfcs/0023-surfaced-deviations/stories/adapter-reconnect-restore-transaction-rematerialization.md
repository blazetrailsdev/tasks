---
title: "adapter-reconnect-restore-transaction-rematerialization"
status: claimed
updated: 2026-07-01
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-01T00:54:48Z"
assignee: "adapter-reconnect-restore-transaction-rematerialization"
blocked-by: null
---

## Context

Surfaced by `converge-adapter-connection-test-one-schema` (RFC 0048) porting
Rails' `AdapterConnectionTest` (`vendor/rails/activerecord/test/cases/adapter_test.rb`).

Rails' `reconnect!(restore_transactions: true)` re-issues `BEGIN` on the fresh
raw connection so a materialized transaction is live again immediately
(`raw_transaction_open?` is true right after reconnect). trails defers
re-materialization, so the raw connection has no live transaction until the next
query. MySQL's real `SAVEPOINT` probe catches this (returns false); PostgreSQL's
`_inTransaction` flag proxy masks it (there is no node-pg `transaction_status`).

Relatedly, inside a transaction the initial `BEGIN` materialization is not
retried on a severed connection the way Rails' retryable materialize path is, so
"transaction restores after remote disconnection" does not reconnect+succeed.

Blocked `AdapterConnectionTest` cases (checked in verbatim, `it.skip` with a
pointer to this story): "materialized transaction state can be restored after a
reconnect", "unmaterialized transaction state can be restored after a
reconnect", "transaction restores after remote disconnection", "active
transaction is restored after remote disconnection".

## Acceptance criteria

- [ ] `reconnect!(restore_transactions: true)` re-materializes an open
      transaction on the raw connection (raw transaction live immediately after
      reconnect) on PostgreSQL and MySQL/MariaDB, matching Rails.
- [ ] A transaction opened after a remote disconnect reconnects and succeeds
      (retryable materialize), matching Rails' "transaction restores".
- [ ] Un-skip the listed cases; they pass verbatim on PG and MySQL/MariaDB
      (and, where applicable, SQLite).
