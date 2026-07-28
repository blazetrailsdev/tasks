---
title: "copy_table hand-builds CREATE TABLE instead of a TableDefinition"
status: ready
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `copy_table` builds a real `TableDefinition` and calls
`create_table(to, **options)`, so every column goes through
`schema_creation` — including the type resolution, default expression
quoting, and `primary_key` handling that live there
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:597-647`).

trails' `copyTable` instead concatenates each column definition as a
string (`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:2700-2740`):
`` `${quoteColumnName(destName)} ${sqlType}` `` plus manually appended `COLLATE`,
`PRIMARY KEY`, `NOT NULL`, `DEFAULT` and `GENERATED ALWAYS AS (...)`
fragments, then a hand-built `CREATE [TEMPORARY] TABLE`.

This was tolerable while `copyTable` was only reachable from the
standalone helper tests. PR #5527 put it on the `alterTable` hot path —
every `removeColumn` / `changeColumn` / `changeColumnNull` /
`changeColumnDefault` / FK and check-constraint edit now builds its
throwaway buffer through it — so the hand-rolled DDL is live code.

Related knock-on deviations in the same method, which converging would
subsume:

- Defaults are read off the reflected column (`col.default`, falling back
  to `col.defaultFunction`) rather than Rails'
  `lookup_cast_type_from_column(column)` + `type.deserialize(column.default)`
  with a `-> { column.default_function }` substitution
  (`sqlite3_adapter.rb:627-634`). The observable behaviour was fixed in
  #5527; the mechanism still diverges.
- Rails passes `column_options[:limit] / :precision / :scale`; trails
  carries the reflected `sqlType` verbatim instead.
- Composite PKs are emitted as a trailing `PRIMARY KEY(...)` string rather
  than `@definition.primary_keys from_primary_key`.

Note the wrinkle #5487 and #5527 both hit: a typeless (BLOB-affinity)
column has an empty declared type, and `visitColumnDefinition`'s
`sqlType ??=` does not treat `""` as absent, so a definition-built column
emits a trailing space where the string-built one emits a bare `"col"`.
See `sqlite-alter-table-typeless-column-affinity` (0023).

## Acceptance criteria

- [ ] `copyTable` builds a `TableDefinition` and emits its CREATE TABLE
      through `schemaCreation` / `createTable`, not string concatenation.
- [ ] Column options travel as options (`limit`, `precision`, `scale`,
      `null`, `collation`, `primaryKey`, `as`/`stored`, `default`) rather
      than pre-rendered SQL fragments.
- [ ] Typeless (BLOB-affinity) columns still round-trip their affinity.
- [ ] Green on all three adapters, in particular
      `sqlite3-copy-table.test.ts`, `sqlite3-introspection.test.ts`,
      `adapters/sqlite3/`, `schema-dumper.test.ts`.
