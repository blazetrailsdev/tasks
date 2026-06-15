---
title: "Close PG indexes() / addIndex / renameIndex Rails-fidelity gaps"
status: claimed
updated: 2026-06-15
rfc: "0026-adapter-layout-fidelity"
cluster: adapter-layout
deps: ["extract-pg-schema-statements-indexes"]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-06-15T12:55:07Z"
assignee: "pg-indexes-rails-fidelity"
blocked-by: null
---

## Context

Surfaced during review of #3301 (the pure code-motion extraction of PG index
statements into `PostgreSQLSchemaStatements`). These are pre-existing fidelity
gaps in the ported index methods — present in `postgresql-adapter.ts` before the
move and carried over verbatim — not regressions. Parallels the existing
`sqlite3-indexes-rails-fidelity` story for the SQLite side.

Rails source: `activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb`.

## Gaps to close

1. **`indexes()` missing `valid` field.** Rails selects `d.indisvalid`
   (line 91) and passes `valid:` to `IndexDefinition` (line 149). The TS
   `PgIndexDefinition` and SQL omit it. Invalid indexes (e.g. a failed
   `CONCURRENTLY` build) need this flag; `SchemaCache` uses it to skip invalid
   indexes for uniqueness validation. Add `d.indisvalid AS is_valid` to the
   SELECT and `valid` to `PgIndexDefinition` (and thread through the schema
   dumper if it round-trips).

2. **`indexes()` SQL missing `i.relkind IN ('i', 'I')` filter.** Rails'
   WHERE clause filters on relkind (line 97). The TS SQL has none — functionally
   equivalent in practice (the `pg_index` join only yields index-class rows) but
   a deviation from Rails.

3. **`renameIndex` missing `validate_index_length!`.** Rails calls
   `validate_index_length!(table_name, new_name)` before `ALTER INDEX`
   (line 567). The TS implementation skips it (no length validation / raise).

4. **`addIndex` missing WHERE-clause column auto-quoting.** Rails' PG override
   of `add_index_options` (lines 937–941) checks whether `:where` is itself a
   column name (`column_exists?`) and quotes it. The TS `addIndex` uses
   `options.where` verbatim.

## Acceptance criteria

- [ ] `indexes()` returns `valid` and the SQL mirrors Rails (relkind filter +
      indisvalid select).
- [ ] `renameIndex` validates new-index-name length per Rails.
- [ ] `addIndex` quotes a bare-column-name `:where` value.
- [ ] api:compare / test:compare delta non-negative; tests cover each behavior.
