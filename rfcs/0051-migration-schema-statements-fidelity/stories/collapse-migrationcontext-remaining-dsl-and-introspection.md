---
title: "collapse-migrationcontext-remaining-dsl-and-introspection"
status: in-progress
updated: 2026-07-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4772
claim: "2026-07-08T03:06:24Z"
assignee: "collapse-migrationcontext-remaining-dsl-and-introspection"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `collapse-migrationcontext-schema-dsl-onto-schemastatements`
(RFC 0051), which collapsed the column-DDL builders (`addColumn`,
`removeColumn`, `renameColumn`, `changeColumn`) in
`packages/activerecord/src/migration.ts` `MigrationContext` onto the adapter's
real `SchemaStatements` and deleted the bespoke `_mapType` SQL/type builder.

Still bespoke in `MigrationContext` (not yet collapsed onto `SchemaStatements`):

- `dropTable` (migration.ts ~2009): hand-rolled `DROP [TEMPORARY] TABLE [IF
EXISTS] ... [CASCADE]` via `executeMutation`. `SchemaStatements#dropTable`
  exists but doesn't cover `temporary:` or default-`IF EXISTS`; reconcile the
  Rails semantics (Rails MySQL `drop_table` temporary handling) and delegate.
- `renameTable` (migration.ts ~2385): bespoke `ALTER TABLE RENAME` plus
  tableNamePrefix/suffix application; `SchemaStatements#renameTable` doesn't
  apply prefix/suffix. Reconcile and delegate.
- Introspection: `_introspectColumns` (bespoke `PRAGMA table_info` /
  `information_schema` / `SHOW COLUMNS`) and `_normalizeIntrospectedType`, plus
  the in-memory `_tables`/`_columns`/`_columnMeta`/`_indexes` bookkeeping that
  `columns()`/`indexes()`/`tables()`/`columnExists()` read. Rails' real
  introspection lives on the adapter (`SchemaStatements#columns`, `#indexes`,
  etc.); back these with the adapter's real introspection where feasible, or
  document the divergence with a tracked reason. NOTE: many tests read
  `MigrationContext#columns()`/`#indexes()` directly, so this is the highest-risk
  slice — do it as its own PR.

## Acceptance criteria

- [ ] `MigrationContext.dropTable` and `.renameTable` delegate to
      `SchemaStatements`, with any Rails-semantic gaps (temporary, prefix/suffix)
      reconciled rather than reimplemented.
- [ ] Bespoke introspection replaced by / backed by the adapter's real schema
      introspection where feasible; remaining divergence documented with a
      tracked reason.
- [ ] No regression in api:compare / test:compare (non-negative delta).
- [ ] loadSchema generated-schema path still builds the canonical worker DB
      identically.
