---
title: "sqlite3-alter-table-drops-generated-columns"
status: ready
updated: 2026-07-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
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

`AbstractSQLite3Adapter#alterTable`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:2358`,
the private table-rebuild used by removeColumn / changeColumn /
add/removeForeignKey / checkConstraint paths, and since #5127 by
`addColumn` for primary-key / NOT-NULL-without-default / stored-generated
adds) gathers the existing column set via `PRAGMA table_info`. SQLite's
`table_info` HIDES generated columns (`table_xinfo` exposes them with
`hidden` 2/3 — the adapter's own `columns()` already uses `table_xinfo`
via `tableStructure`, sqlite3-adapter.ts:2583). So any rebuild of a table
that has GENERATED columns silently drops them: they are absent from the
rebuilt CREATE TABLE.

Rails' `alter_table`/`copy_table` re-emits the GENERATED clause from the
column's `default_function` (vendor/rails
activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:624
sets `column_options[:as] = column.default_function`, and :645 excludes
`as:` columns from `columns_to_copy`). trails' `copyTable` already does
this correctly (sqlite3-adapter.ts:2693 area re-emits
`GENERATED ALWAYS AS (...) STORED/VIRTUAL` and excludes virtuals from the
copy) — `alterTable` is the remaining blind path.

Observable today: `virtual-column.test.ts` "change table with stored
generated column" rebuilds `virtual_columns` and silently loses
`upper_name`/`lower_name`/`octet_name`/`mutated_name` (assertions pass
because they only touch the added column).

## Acceptance criteria

- `alterTable` sources columns from `table_xinfo` (or `columns()`),
  re-emits the GENERATED clause for stored/virtual columns in the rebuilt
  DDL, and excludes generated columns from the INSERT..SELECT copy.
- A test proves generated columns survive a rebuild (e.g. removeColumn on
  a table with a stored generated column keeps the generated column and
  its values); fails on baseline.
