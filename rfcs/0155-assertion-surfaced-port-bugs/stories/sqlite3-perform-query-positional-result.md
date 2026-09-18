---
title: "sqlite3-perform-query-positional-result"
status: draft
updated: 2026-09-17
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

Split from `assertions-calculations-test`. Rails' SQLite3 `perform_query`
builds a positional result: `ActiveRecord::Result.new(stmt.columns, stmt.to_a)`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:90,103`).
trails' `performQuery`
(`packages/activerecord/src/connection-adapters/sqlite3/database-statements.ts`,
the `stmt.reader` arm) calls `stmt.all()` and wraps the row hashes with
`Result.fromRowHashes(rows)`. The drivers return one object per row keyed by
column name, so two result columns with the same name collapse into one
(`SELECT "topics"."id", "replies"."id"` comes back as a single `id`).
`_narrowSpilledBigInts` (`sqlite3-adapter.ts`) is keyed by column name too.

Every driver has a positional mode: better-sqlite3 `stmt.raw(true)`,
`node:sqlite` `StatementSync#setReturnArrays(true)`, libsql `stmt.raw()`, and
expo `executeForRawResultAsync`. The `SqliteStatement` interface
(`packages/activerecord/src/sqlite-adapter.ts:18`) exposes only the hash-mode
`all()`.

Four `calculations_test.rb` tests are blocked by the collapse. They keep their
pre-convergence bodies in `packages/activerecord/src/calculations.test.ts`:
`pluck with join`, `pluck with join alias`,
`pluck with hash argument with multiple tables`, and
`pluck with qualified name on loaded` (`calculations_test.rb:1158-1260`).

## Acceptance criteria

- The SQLite3 `performQuery` builds `Result` from positional rows and column
  names, as Rails does, on every driver.
- `_narrowSpilledBigInts` works by column index.
- The four tests above mirror Rails' assertions and pass on SQLite, PostgreSQL
  and MySQL. Their rows leave the activerecord assertion mark.
