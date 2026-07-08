---
title: "collapse-migrationcontext-introspection-onto-adapter"
status: done
updated: 2026-07-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4773
claim: "2026-07-08T03:25:23Z"
assignee: "collapse-migrationcontext-introspection-onto-adapter"
blocked-by: null
closed-reason: null
---

## Context

Follow-up carved out of
`collapse-migrationcontext-remaining-dsl-and-introspection` (RFC 0051). That
story collapsed `MigrationContext.dropTable` and `.renameTable` onto the
adapter's `SchemaStatements` (PR: dropTable/renameTable delegation). The
introspection slice was deferred to its own PR because it is the highest-risk
part — many tests read `MigrationContext#columns()`/`#indexes()`/`#tables()`/
`#columnExists()` directly.

Still bespoke in `MigrationContext` (packages/activerecord/src/migration.ts):

- `_introspectColumns` (~migration.ts:1671): hand-rolled `PRAGMA table_info`
  (sqlite) / `information_schema.columns` (postgres) / `SHOW COLUMNS` (mysql).
- `_normalizeIntrospectedType` (~migration.ts:1758): adapter-emulation-mode
  type normalization threaded from `_introspectColumns`.
- In-memory bookkeeping `_tables` / `_columns` / `_columnMeta` / `_indexes`
  (migration.ts:1581-1618), mutated by createTable/addColumn/removeColumn/
  dropTable/renameTable and read by `columns()`/`indexes()`/`tables()`/
  `columnExists()`.

Rails' real introspection lives on the adapter: `SchemaStatements#columns`,
`#indexes`, `#tables`, `#columnExists` (abstract/schema-statements.ts already
implements these, backed by adapter catalog queries). The mysql2 adapter has
`tables()`/`indexes()`/etc. (mysql2-adapter.ts:1349+), PG likewise.

## Acceptance criteria

- [ ] `MigrationContext#columns()`/`#indexes()`/`#tables()`/`#columnExists()`
      are backed by the adapter's real `SchemaStatements` introspection where
      feasible, replacing the bespoke `_introspectColumns` /
      `_normalizeIntrospectedType` and the in-memory `_tables`/`_columns`/
      `_columnMeta`/`_indexes` maps.
- [ ] Any remaining divergence (e.g. post-CTAS column derivation) is documented
      with a tracked reason rather than silently retained.
- [ ] No regression in api:compare / test:compare (non-negative delta).
- [ ] loadSchema generated-schema path still builds the canonical worker DB
      identically.
- [ ] Single PR from main; 500 LOC ceiling; test names match Rails verbatim.
