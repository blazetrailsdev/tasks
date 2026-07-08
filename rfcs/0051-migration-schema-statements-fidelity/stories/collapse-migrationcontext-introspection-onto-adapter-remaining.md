---
title: "collapse-migrationcontext-introspection-onto-adapter-remaining"
status: claimed
updated: 2026-07-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-08T10:05:52Z"
assignee: "collapse-migrationcontext-introspection-onto-adapter-remaining"
blocked-by: null
closed-reason: null
---

## Context

Follow-up carved out of `collapse-migrationcontext-introspection-onto-adapter`
(RFC 0051). That PR collapsed the CTAS column derivation onto the adapter's real
introspection (`MigrationContext.createTable`'s `as:` branch now reads back via
`this.connection.columns()` — Rails `new_column_from_field` — replacing the
bespoke `_introspectColumns` catalog SQL and `_normalizeIntrospectedType` type
normalizer, both deleted). The remaining, higher-blast-radius slice was deferred
here and is documented as a TRACKED DIVERGENCE in
`packages/activerecord/src/migration.ts` (comment above the `_tables` field of
`class MigrationContext`).

Still bespoke: `MigrationContext#columns()` / `#indexes()` / `#tables()` /
`#columnExists()` / `#tableExists()` / `#indexExists()` are **synchronous** and
served from in-memory maps `_tables` / `_columns` / `_columnMeta` / `_indexes`
(migration.ts ~1581-1620), mutated by createTable / addColumn / removeColumn /
renameColumn / changeColumn / dropTable / renameTable / addIndex / removeIndex.

## Why this is its own PR

Collapsing these readers onto the adapter's real async introspection
(`SchemaStatements#columns/indexes/tables/columnExists`) requires making the
readers **async**, which ripples into:

- The synchronous `SchemaDumper.dump(ctx)` protocol (schema-dumper.ts
  `dumpTables` has a sync branch that throws if `columns()/indexes()` return a
  Promise) and its many exact-output dump assertions in
  `schema-dumper.test.ts`, `date-time-precision.test.ts`,
  `time-precision.test.ts` — dumping from real introspection may format
  differently than dumping from declared bookkeeping.
- ~18 synchronous `ctx.columns()/indexes()/tables()/columnExists()/
tableExists()` call sites in `migration.test.ts` and `migration.trails.test.ts`
  that would each need `await`.
- The two `addIndex bookkeeping ...` trails tests in `migration.trails.test.ts`
  which assert declared-but-not-persisted `_indexes` metadata (e.g. sqlite
  `using: "hash"`) that real introspection cannot recover.

## Acceptance criteria

- [ ] `MigrationContext` `columns()/indexes()/tables()/columnExists()/
tableExists()/indexExists()` delegate to the adapter's async
      `SchemaStatements` introspection; the `_tables`/`_columns`/`_columnMeta`/
      `_indexes` maps and their mutation code are removed.
- [ ] `SchemaDumper.dump(ctx)` callers converge to the async dump path.
- [ ] No regression in api:compare / test:compare (non-negative delta).
- [ ] loadSchema generated-schema path still builds the canonical worker DB
      identically.
- [ ] Single PR from main; 500 LOC ceiling; test names match Rails verbatim.
