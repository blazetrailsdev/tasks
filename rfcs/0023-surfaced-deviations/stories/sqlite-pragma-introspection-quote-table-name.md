---
title: "SQLite columns()/indexes() interpolate table name into PRAGMA without quote_table_name escaping"
status: in-progress
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 40
pr: 3945
claim: "2026-06-23T01:15:18Z"
assignee: "sqlite-pragma-introspection-quote-table-name"
blocked-by: null
---

## Context

Surfaced while merging #3782 (parameterize-table-column-exists-introspection),
which converged `tableExists`/`columnExists` away from raw identifier
interpolation. The adjacent SQLite introspection helpers still interpolate the
table name directly into PRAGMA statements with bare double-quote wrapping and
no escaping:

- `columns()` — `PRAGMA table_info("${tableName}")`
  (`abstract/schema-statements.ts:945`, and again at `:1102` in another branch)
- `indexes()` — `PRAGMA index_list("${tableName}")`
  (`abstract/schema-statements.ts:1047`) and `PRAGMA index_info("${row.name}")`
  (`:1050`)

A table/index name containing a `"` would break the SQL (e.g. a name like
`a"b` produces `PRAGMA table_info("a"b")`). PRAGMA cannot take bind parameters,
so the fix is to quote the identifier safely — Rails' SQLite3 adapter uses
`quote_table_name(...)` (which escapes embedded quotes), not bare interpolation.
trails already exposes `this._qi(name)` (→ `adapter.quoteIdentifier`) used
elsewhere in this file; the same helper should be applied here.

Rails reference:
`activerecord/lib/active_record/connection_adapters/sqlite3/schema_statements.rb`
(`table_structure` / `exec_query("PRAGMA table_info(#{quote_table_name(table_name)})")`)
and the index PRAGMA calls in the same adapter.

## Acceptance criteria

- [ ] SQLite `columns()` PRAGMA calls (`schema-statements.ts:945`, `:1102`) quote
      the table name via `_qi`/`quoteTableName` instead of bare `"${tableName}"`.
- [ ] SQLite `indexes()` PRAGMA calls (`:1047`, `:1050`) quote the table/index
      name the same way.
- [ ] A test demonstrates introspection does not break on an identifier
      containing a double quote.
- [ ] api:compare / test:compare delta non-negative.
