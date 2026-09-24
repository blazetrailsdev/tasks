---
title: "Retire the adapter whenClosed / async-open / transactionStatus driver shims"
status: in-progress
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: 9
pr: trails#8036
claim: "2026-09-24T15:31:05Z"
assignee: "adapter-driver-open-close-and-transaction-status-shims"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `relabel-sync-shim-permanent-receipts`. Four adapter members have
no Rails counterpart because trails' drivers open, close and report state
asynchronously where Ruby's are synchronous:

- `SQLite3Adapter#whenClosed` and `PostgreSQLAdapter#whenClosed` — awaited by
  `ConnectionPool` after `disconnect!` / `discard!` and by
  `tasks/sqlite-database-tasks.ts`. Rails' `disconnect!` returns once the
  socket/file is closed (`sqlite3_adapter.rb` `disconnect!`,
  `postgresql_adapter.rb` `disconnect!`).
- `SQLite3Adapter#completeAsyncConnect` / `SQLite3Adapter.openAsync` — the
  async-driver (libsql) open. Rails' `connect` is synchronous
  (`sqlite3_adapter.rb` `connect`).
- `PostgreSQLAdapter#transactionStatus` — synthesizes
  `PG::Connection#transaction_status` from node-pg state; Rails reads it off
  the raw connection (`postgresql_adapter.rb:375,850`).

## Acceptance criteria

- `disconnect!` settles when the driver has closed, so `whenClosed` is
  deleted from both adapters and the pool awaits `disconnectBang()` instead.
- The async open goes through `connect` / `connectBang` and `openAsync` /
  `completeAsyncConnect` are deleted.
- `transaction_status` is read off the raw-connection wrapper, not the
  adapter.
