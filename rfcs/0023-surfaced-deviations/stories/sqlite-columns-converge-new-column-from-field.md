---
title: "Converge SQLite columns() onto Rails new_column_from_field flow (generated default_function, dead-path removal)"
status: done
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: 40
pr: 3946
claim: "2026-06-23T01:07:15Z"
assignee: "sqlite-columns-converge-new-column-from-field"
blocked-by: null
---

## Context

PR #3833 (persistence-auto-populated-column-order) added SQLite rowid/AUTOINCREMENT
reflection to `SQLite3Adapter#columns` (`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`),
but that method remains a hand-rolled reflection path separate from the
Rails-faithful flow. Rails' `SQLite3Adapter#columns` flows
`column_definitions → table_structure_with_collation → new_column_from_field`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:716`).
trails has a `newColumnFromField` + `tableStructure` implementation
(`sqlite3/schema-statements.ts:236`, `sqlite3-adapter.ts:tableStructure`) that
mirrors this, but it is dead code — `columns()` does its own SqlTypeMetadata /
defaultFunction construction instead.

Residual deviations introduced/surfaced by #3833:

- `columns()` reads only `collation`/`auto_increment` from
  `tableStructureWithCollation` and derives `defaultFunction` from the raw PRAGMA
  `dflt_value`, intentionally bypassing the GENERATED `dflt_value` override. So a
  STORED generated column reflected via `columns()` does NOT report its generation
  expression as `default_function`, unlike Rails `new_column_from_field`.
- `tableStructureSql` was widened from Rails' literal single `\s` to `\s*` in the
  column-split lookahead to tolerate hand-written multi-line CREATE TABLE; Rails
  uses `\s` (`sqlite3_adapter.rb:786`).

## Acceptance criteria

- [ ] SQLite `columns()` routes through `tableStructure` + `newColumnFromField`
      (the Rails `new_column_from_field` flow), eliminating the parallel
      hand-rolled reflection in `columns()`.
- [ ] STORED generated columns reflect their generation expression as
      `default_function` (matches Rails), verified by a test.
- [ ] Revisit the `\s`→`\s*` splitter widening once on the unified path; keep
      multi-line CREATE TABLE reflection working (the `adapters/sqlite3/collation.test.ts`
      multi-line DDL must still reflect COLLATE).
- [ ] No regression in sqlite columns/collation/schema-dump reflection.
