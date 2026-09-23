---
title: "sqlite3-pragmas-query-block-arm-and-table-info"
status: draft
updated: 2026-09-23
rfc: "0094-sqlite3-adapter-construction-fidelity"
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

`sqlite3-pragmas-getters-unported` ported the Pragmas getters into
`packages/activerecord/src/sqlite/pragmas.ts`. Two parts of
`vendor/sqlite3/lib/sqlite3/pragmas.rb` are still missing:

- **The `&block` arm.** `get_query_pragma(name, *params, &block)` (`:41-49`)
  passes the block to `execute`. With a block, `Database#execute`
  (`vendor/sqlite3/lib/sqlite3/database.rb:247-259`) yields each row instead
  of returning the frozen array. Twelve readers forward it: `collation_list`,
  `compile_options`, `database_list`, `foreign_key_check`, `foreign_key_list`,
  `incremental_vacuum`, `index_info`, `index_list`, `index_xinfo`,
  `integrity_check`, `quick_check` and `stats`. trails' `SqliteConnection#execute`
  (`packages/activerecord/src/sqlite-adapter.ts`, implemented in the four
  bindings under `src/sqlite/`) takes no block, so the port drops it at both
  levels. `output/block-param-mismatches.json` lists all 13. `sqlite3` is not
  in the block-param gate, so nothing reds.
- **`table_info` (`:525-556`)** and its private helpers `version_compare`
  (`:560-571`) and `tweak_default` (`:576-585`). It needs `prepare`,
  `Statement#columns` and `SQLite3.libversion`. expo-sqlite's `columns()`
  returns `[]` today.

## Acceptance criteria

- [ ] `SqliteConnection#execute` takes a trailing block and yields rows when one is given, as `database.rb:252-255` does, in all four bindings.
- [ ] `getQueryPragma` and the twelve readers above take and forward the block.
- [ ] `tableInfo`, `versionCompare` and `tweakDefault` are ported into `sqlite/pragmas.ts` with gem names and bodies.
