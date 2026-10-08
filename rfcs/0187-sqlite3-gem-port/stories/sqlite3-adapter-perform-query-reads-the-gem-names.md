---
title: "SQLite3 perform_query, the statement pool and encoding call the gem's methods"
status: draft
updated: 2026-10-08
rfc: "0187-sqlite3-gem-port"
cluster: migration
packages: ["activerecord", "sqlite3"]
deps: ["sqlite3-adapter-new-client-is-database-new"]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails `perform_query` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:77-112`): `raw_connection.execute_batch2(sql)`
(`:80`); `stmt = @statements[sql] ||= raw_connection.prepare(sql)`, `stmt.reset!`,
`stmt.bind_params(type_casted_binds)` (`:82-84`); `stmt.column_count.zero?` → `stmt.step` else
`ActiveRecord::Result.new(stmt.columns, stmt.to_a)` (`:86-91`, again `:99-104`); `stmt.close`
(`:106`); `@last_affected_rows = raw_connection.changes` (`:109`).

trails (`packages/activerecord/src/connection-adapters/sqlite3/database-statements.ts:206-239`): `rawConnection.exec(sql)` (`:206`), no
`reset!`, `!stmt.reader` (`:212,226`), `stmt.columns().map((c) => c.name)` (`:216,230`), and an
extra `this._lastInsertRowid = await rawConnection.lastInsertRowId()` (`:239`) Rails does not have.

Also: `StatementPool#dealloc` is `stmt.close unless stmt.closed?` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:97-99`;
trails `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:1264`), and `encoding` is `any_raw_connection.encoding.to_s`
(`:238`; trails `:386-394`, a `pragma("encoding")` with a sync/async split).

## Acceptance criteria

- [ ] `performQuery` is `database_statements.rb:77-112` line for line: `executeBatch2`, `prepare`, `resetBang`, `bindParams`, `columnCount() === 0`, `step`, `columns()`, `toA()`, `close`, `changes`.
- [ ] `_lastInsertRowid`: Rails' SQLite `last_inserted_id` path is found in `vendor/rails` and ported as written; the extra read at `:239` is deleted, or kept with a `@inventedArm lastInsertRowId` receipt naming why (RFC open question 5).
- [ ] `dealloc` and `encoding` read as Rails'. `encoding`'s sync/async arm follows open question 1.
- [ ] The bigint handling at `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:1142-1171` (`setReadBigInts`) follows open question 3.
- [ ] No `@missingRailsCall` remains on `performQuery`; its call-gate and call-args rows are deleted by hand and the shards tightened. `pnpm parity:api:arms:throws` green.

## Verification

```bash
pnpm vitest run packages/activerecord/src/connection-adapters/sqlite3 && pnpm parity:api:calls && pnpm parity:api:calls:args
```
