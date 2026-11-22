---
title: "sqlite3-test-default-transaction-mode"
status: in-progress
updated: 2026-11-22
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10594
claim: "2026-11-22T20:24:13Z"
assignee: "sqlite3-better-sqlite3-and-expo-engines-honor-strict"
blocked-by: null
closed-reason: null
---

## Context

`test_default_transaction_mode` (`vendor/sqlite3/v2.6.0/test/test_database.rb:812-849`) opens a temp file with the
`Database.new` block arm (ported sync-only in trails#10524), then for each `default_transaction_mode:` (nil,
`:deferred`, `:immediate`, `:exclusive`) holds a `transaction` on one connection and asserts a second connection's read
and write either succeed or raise `SQLite3::BusyException`. Unported because it needs a temp file reachable without
`node:*` in the test, and the engine must surface SQLITE_BUSY as `BusyException` through `rbSqlite3Raise`
(`packages/sqlite3/lib/errors.ts`).

## Acceptance criteria

- [ ] `it("default transaction mode")` in `packages/sqlite3/test/test-database.test.ts`, ported line for line against the better-sqlite3 engine.
- [ ] Each of the four modes asserts the read/write outcome from `test_database.rb:819-824`.
