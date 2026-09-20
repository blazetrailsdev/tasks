---
title: "sqlite3-statement-closed-busy-parity"
status: draft
updated: 2026-09-20
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`adapters/sqlite3/sqlite3_adapter_test.rb`'s `test_statement_closed`
(`vendor/rails/activerecord/test/cases/adapters/sqlite3/sqlite3_adapter_test.rb:927-945`)
stubs `SQLite3::Statement#step` to raise `SQLite3::BusyException`, asserts the
statement is closed (`assert_called(statement, :close)`), and asserts the
adapter raises `ActiveRecord::StatementTimeout` carrying `@conn.pool` as its
`connection_pool`.

trails parked the port as `it.skip` in
`packages/activerecord/src/adapters/sqlite3/sqlite3-adapter.test.ts`
(assertion parity for the file is otherwise at 0 after trails#PR).

Two gaps block it:

- `SqliteStatement` (`packages/activerecord/src/sqlite-adapter.ts:18-28`) has no
  `step`; better-sqlite3 exposes `all` / `get` / `run` instead, so the Rails
  stub site has no direct analogue.
- A `SQLITE_BUSY` raised while a statement is read is not translated to
  `StatementTimeout` by
  `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`'s exception
  translation, so the `assertRaises([StatementTimeout])` arm cannot pass.

## Acceptance criteria

- `SQLITE_BUSY` surfaced from a statement read translates to
  `ActiveRecord::StatementTimeout` with the adapter's pool as `connectionPool`,
  matching `sqlite3_adapter.rb`'s `translate_exception`.
- The statement is closed on that path.
- `statement closed` is un-skipped and green, and
  `pnpm parity:test -- --package activerecord --assertions --missing` still
  reports 0 mismatches for `adapters/sqlite3/sqlite3_adapter_test.rb`.
