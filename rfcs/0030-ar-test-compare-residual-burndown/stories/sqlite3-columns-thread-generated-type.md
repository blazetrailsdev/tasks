---
title: "sqlite3-columns-thread-generated-type"
status: claimed
updated: 2026-07-05
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: "2026-07-05T21:41:54Z"
assignee: "sqlite3-columns-thread-generated-type"
blocked-by: null
---

## Context

Surfaced while porting `copy_table_test.rb` to
`packages/activerecord/src/adapters/sqlite3/copy-table.test.ts`. The test
`test_copy_table_with_virtual_column` is skipped (BLOCKED tag in that file).

`connection-adapters/sqlite3-adapter.ts` `columns()` (around line 1925-1968)
builds `Sqlite3Column`s but never passes `generatedType`, even though
`tableStructureWithCollation` already detects GENERATED columns and their
expressions. As a result `Sqlite3Column#isVirtual()` is always false, so
`copy_table` treats a generated column (`upper_name AS UPPER(name) STORED`) as a
content column and emits `INSERT INTO ... (upper_name) SELECT ...`, which SQLite
rejects. `column.virtualStored?` and `column.defaultFunction` also never report
the generated state/expression.

## Acceptance criteria

- `columns()` threads `generatedType` ("stored"/"virtual") and the generated
  expression (default_function) onto `Sqlite3Column` for generated columns.
- `copy_table` skips generated columns in content copy (already gated on
  `isVirtual()`).
- Un-skip `copy table with virtual column` in
  `packages/activerecord/src/adapters/sqlite3/copy-table.test.ts`.
