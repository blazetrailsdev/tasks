---
title: "columns-pg-honor-search-path"
status: ready
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced in review of #3782 (parameterize-table-column-exists-introspection).
That PR converged `tableExists` to honor the active search_path via
`ANY (current_schemas(false))` for PG, matching Rails' `quoted_scope`
(`postgresql/schema_statements.rb:1129`). But `columns()` — and therefore
`columnExists`, which now delegates to it (`abstract/schema-statements.ts:965`,
PG branch) — still hardcodes `table_schema = 'public'` in its
`information_schema.columns` query.

Consequence: a table on a non-public schema (on the search_path) can pass
`tableExists` yet have `columnExists` return false, because `columns()` only
looks in `public`. Rails' `column_exists?` inherits `columns`' schema-qualified
resolution and stays consistent.

Rails reference: PG `column_definitions` / `columns` resolve the column list
through `quoted_scope`-style schema qualification, not a hardcoded `'public'`.
See `activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb`
(`column_definitions`) and `postgresql_adapter.rb`.

## Acceptance criteria

- [ ] PG `columns()` (`abstract/schema-statements.ts` PG branch, ~line 965)
      resolves columns against the active search_path / schema-qualified table
      name rather than a hardcoded `table_schema = 'public'`, so `columnExists`
      is consistent with `tableExists` for non-public-schema tables.
- [ ] A test demonstrates `columnExists` returns true for a column on a
      table in a non-public schema that is on the search_path.
- [ ] api:compare / test:compare delta non-negative.
