---
title: "sqlite3: SQLite3::Statement is a class over an engine interface, with the gem's eight methods"
status: draft
updated: 2026-10-08
rfc: "0187-sqlite3-gem-port"
cluster: database-and-statement
packages: ["sqlite3"]
deps: ["sqlite3-lift-the-nested-port-into-a-package"]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SqliteStatement` (`packages/activerecord/src/sqlite-adapter.ts:18-31`) is an interface each of six drivers implements
in full: `run`, `get`, `all`, `iterate` (better-sqlite3 names), `bindParams`, `step`, `toA`,
`columns` (gem names), `setReadBigInts`, `reader`, `close`, `closed`. `SyncSqliteStatement`
(`:51-64`) repeats it.

The gem's `Statement`, for what Rails calls (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:82-106`,
`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:98`): C `vendor/sqlite3/v2.6.0/ext/sqlite3/statement.c`: `close` `:681`, `closed?` `:682`,
`bind_param` `:683`, `reset!` `:684`, `step` `:686`, `done?` `:687`, `column_count` `:688`,
`column_name` `:689`; Ruby `vendor/sqlite3/v2.6.0/lib/sqlite3/statement.rb`: `initialize(db, sql)` `:28`,
`bind_params` `:52`, `columns` `:118`, `each` `:123` (with `Enumerable` for `to_a`),
`must_be_open!` `:142`.

The Ruby methods are bodies over the C ones: `bind_params` loops `bind_param`, `columns` maps
`column_name` over `column_count`, `each` loops `step` until `done?`. Written once over an
engine, they stop being six copies (e.g. `withNullBinds`, `sqlite/better-sqlite3.ts:29-47`).

## Acceptance criteria

- [ ] `packages/sqlite3/src/statement.ts` is `SQLite3.Statement` with `bindParams`, `columns`, `each` (+ `Enumerable` from ruby-compat, so `toA`), `mustBeOpenBang` ported from `statement.rb`, and `close`, `isClosed`, `bindParam`, `resetBang`, `step`, `isDone`, `columnCount`, `columnName` delegating to a private engine statement.
- [ ] The engine-statement interface is internal to the package and has only the C primitives above. It is exported as a type from `"."` so `packages/website` can implement it.
- [ ] Sync or `Promise` return types follow the answer to RFC 0187-sqlite3-gem-port open question 1. BEFORE converting anything, this story measures and reports in its PR body: (a) the AR `sqlite-mem` lane's wall time with `step` / `prepare` returning `Promise` on better-sqlite3 versus today, and (b) every caller that relies on a sync engine completing inside an un-awaited `lock.synchronize` block (CLAUDE.md § "The adapter lock defaults to a monitor"). If the question is unanswered when this is claimed, stop after the measurement.
- [ ] `setReadBigInts` has no gem counterpart (RFC open question 3); implement the answer.
- [ ] No driver is converted here; the class is exercised by a fake engine in `*.trails.test.ts` and by ported cases from `vendor/sqlite3/v2.6.0/test/test_statement.rb` for the eight methods.

## Verification

```bash
pnpm vitest run packages/sqlite3 && pnpm parity:api
```
