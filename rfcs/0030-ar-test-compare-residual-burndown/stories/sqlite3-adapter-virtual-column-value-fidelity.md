---
title: "sqlite3-adapter-virtual-column-value-fidelity"
status: in-progress
updated: 2026-07-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: 5127
claim: "2026-07-23T03:46:36Z"
assignee: "sqlite3-adapter-virtual-column-value-fidelity"
blocked-by: null
closed-reason: null
---

## Context

15 assertion-VALUE mismatches across two sqlite3 adapter files, same root
cause — trails tests use a different column/data set than Rails:

- `adapters/sqlite3/sqlite3-adapter.test.ts` (8) vs
  `vendor/rails/activerecord/test/cases/adapters/sqlite3/sqlite3_adapter_test.rb`:
  the expression-index family ("expression index", "... with trailing comment",
  "... with where", "complicated expression", "not everything an expression")
  asserts `max(id, price)` where Rails asserts `max(id, number)` (Rails uses
  the barcodes-style `number` column); "columns with default" asserts "1" vs
  Rails "10"; "exec insert with quote" asserts the inserted string vs Rails'
  id/value pair; "add column with custom primary key" asserts true/"custom_id"
  vs Rails' "id"/"string".
- `adapters/sqlite3/virtual-column.test.ts` (7) vs
  `.../adapters/sqlite3/virtual_column_test.rb`: every generated-column test
  asserts different data ("RAILS"/"rails"/"RaiLs"/5/9/11/100 in Rails vs
  110/"Alice Smith"/"1,2"/7/8/"John Doe"/20 in trails) — the trails file was
  built on invented rows/columns instead of Rails' `virtual_columns` setup.

Converge both files to Rails' table definitions and data so the asserted
values match exactly.

## Acceptance criteria

- Both files mirror Rails' column names and seeded data; assertions match
  Rails values.
- `--assertions` shows 0 value-mismatches for both files.
