---
title: "sqlite3-string-column-no-default-limit"
status: done
updated: 2026-07-05
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: 4640
claim: "2026-07-05T22:21:55Z"
assignee: "sqlite3-string-column-no-default-limit"
blocked-by: null
---

## Context

Surfaced while porting `copy_table_test.rb` to
`packages/activerecord/src/adapters/sqlite3/copy-table.test.ts`. The test
`test_copy_table_with_id_col_that_is_not_primary_key` is skipped (BLOCKED tag in
that file).

The canonical `goofy_string_id.id` string column is emitted as `varchar(255)`,
so its introspected `limit` is 255. Rails' bare `t.string` (sqlite3) maps to
`varchar` with no length → `limit` nil. The test asserts both the original and
copied `id` columns have a nil limit.

## Acceptance criteria

- Unbounded string columns (no explicit `limit`) emit `varchar` without the
  implicit 255 length for the SQLite adapter, matching Rails.
- Un-skip `copy table with id col that is not primary key` in
  `packages/activerecord/src/adapters/sqlite3/copy-table.test.ts`.
