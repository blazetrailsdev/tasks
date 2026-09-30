---
title: "sqlite3 perform_query's batch arm drops execute_batch2's result"
status: draft
updated: 2026-09-30
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `SQLite3::DatabaseStatements#perform_query`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:78-80`)
takes the batch arm as `result = raw_connection.execute_batch2(sql)`. `execute_batch2`
(`vendor/sqlite3/v2.6.0/lib/sqlite3/database.rb:328-337`) returns the rows of any query in the
batch, as an empty array when there are none. `notification_payload[:row_count]` is then
`result&.length || 0` (`:112`).

trails' `performQuery`
(`packages/activerecord/src/connection-adapters/sqlite3/database-statements.ts`, the
`if (batch)` arm) calls `rawConnection.exec(sql)` and sets `result = Result.empty()`. So a batch
containing a query returns no rows, and its `row_count` is always 0.

## Acceptance criteria

- `SqliteConnection` gains sqlite3-ruby's `execute_batch2` as `executeBatch2(sql)` on each
  driver, returning the batch's rows.
- The batch arm of `performQuery` is `result = await rawConnection.executeBatch2(sql)`, and
  `notificationPayload.row_count` reflects its length.
- `pnpm parity:api:calls` / `:args` stay green, and the `sqlite-drivers` tests cover
  `executeBatch2` on every driver.
