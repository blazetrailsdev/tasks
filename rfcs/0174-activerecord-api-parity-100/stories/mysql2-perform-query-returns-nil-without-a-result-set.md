---
title: "activerecord: Mysql2 perform_query returns nil when the statement has no result set"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2/database_statements.rb:51-104`
`perform_query` returns what `raw_connection.query` / `stmt.execute` returned: a `Mysql2::Result` for a
row-returning statement and `nil` otherwise. `cast_result` (`:110-125`) opens with
`return ActiveRecord::Result.empty if raw_result.nil?`, `affected_rows` (`:127-131`) with
`free_raw_result(raw_result) if raw_result`, and `:98` reads `result&.size || 0`.

`packages/activerecord/src/connection-adapters/mysql2/database-statements.ts` `performQuery` always
returns a `Mysql2RawResult` object and encodes "no result set" as `rows: null`, carrying
`affectedRows` / `insertId` on the same object. So `castResult` guards on `rawResult.rows == null`,
`toA` is `() => rows ?? []`, and callers and tests read `.rows` off a value Rails has as `nil`
(`adapters/mysql2/mysql2-adapter-perform-query.trails.test.ts` asserts `.rows` is null for DDL).
trails#8324 gave the object `fields` (names) and `toA()`; this is the remaining shape gap.

## Acceptance criteria

- [ ] `performQuery` returns `null` for a statement with no result set, and the `Mysql2::Result` stand-in (`fields`, `toA`, `size`, the statement to close) otherwise; affected rows and the insert id are read where Rails reads them (`@affected_rows_before_warnings`, `raw_connection.last_id`).
- [ ] `castResult`, `affectedRows` and the `row_count` payload line mirror `mysql2/database_statements.rb:98,110-131` guard for guard.
- [ ] MariaDB lane green, including the prepared-statements variant.
