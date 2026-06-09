---
title: "Step 3 — Route PgTableDefinition.toSql() through PgSchemaCreation"
status: ready
updated: 2026-06-08
rfc: "0018-ddl-visitor-convergence"
cluster: ddl-visitor-convergence
deps:
  - step1-delete-dead-mysql-branches
deps-rfc: []
est-loc: 80
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`PgTableDefinition.toSql()` currently:

1. Calls `super.toSql()` — the hand-rolled `AbstractTableDefinition.toSql()`
2. Applies `UNLOGGED` via regex: `sql.replace(/^CREATE TABLE/, "CREATE UNLOGGED TABLE")`
3. Appends exclusion/unique constraints via `appendConstraintsToSql` (string splice)

`PgSchemaCreation` already handles all three features:

- `UNLOGGED` via `tableModifierInCreate` override (`postgresql/schema-creation.ts:345`)
- Exclusion/unique constraints via `tableConstraintStatements` override
  (`postgresql/schema-creation.ts:326`)
- PG column collation via `addColumnOptionsBang` override
- UUID PRIMARY KEY with `DEFAULT gen_random_uuid()` via `addColumnOptionsBang`
- FK deferrable and `NOT VALID` via `visitForeignKeyDefinition` and `visitCheckConstraintDefinition`
- `GENERATED ALWAYS AS ... STORED` via `_pgGeneratedClause` in `addColumnOptionsBang`

The hand-rolled path misses PG column-level collation (silently dropped) and inverts
the `DEFAULT`/`NOT NULL` order. Routing through the visitor fixes both.

## Acceptance criteria

- [ ] `postgresql/schema-definitions.ts:PgTableDefinition.toSql()` is rewritten to:
      `typescript
override toSql(): string {
    return new PgSchemaCreation(this._adapter).accept(this);
}
`
      Verify `this._adapter` is the correct field name for the quoting adapter stored
      on `PgTableDefinition` (it receives `adapter:` option in its constructor at
      `postgresql-adapter.ts:4858`). Check if `PgTableDefinition` stores it as a
      private field and expose it appropriately — may require promoting to `protected`
      on `AbstractTableDefinition` first.
- [ ] The private `appendConstraintsToSql` and `tableElementListRange` methods on
      `PgTableDefinition` become dead code; delete them.
- [ ] `pnpm tsc --build` clean.
- [ ] All of the following test files pass: - `postgresql/schema-definitions.test.ts` — several tests in the `TableDefinition#toSql`
      describe block assert specific SQL strings; update them where the output now
      matches the visitor (especially `DEFAULT`/`NOT NULL` order changes). - `postgresql/schema-creation.test.ts`
- [ ] PG adapter-dir validation at `AR_DB_FORKS=1`:
      `bash
PG_TEST_URL=... TEST_ADAPTER=postgresql AR_DB_FORKS=1 RUN_ADAPTER_DIRS=1 \
  pnpm vitest run packages/activerecord/src/connection-adapters/adapters/postgresql/schema.test.ts
`
      (adjust path to the PG schema adapter dir test — verify against CI config)
- [ ] Verify `PgSchemaCreation.typeToSql`'s `primary_key` case: it calls `super.typeToSql`
      which returns `"SERIAL PRIMARY KEY"` for postgres. Confirm no regression on
      `createTable` with default PK after this change.

## Notes

`PgSchemaCreation.typeToSql` delegates to `this.adapter.typeToSql` for all types except
`primary_key`. `PostgreSQLAdapter.typeToSql` routes through `nativeDatabaseTypesOverrides`
and `pgDatetimeConfig.datetimeType`. The hand-rolled path's inline switch uses a
simplified type map. After this change, `createTable` will use the adapter's
`typeToSql` for type resolution — this is the Rails-faithful behavior (Rails'
`SchemaCreation` delegates `type_to_sql` back to `@conn`). Verify that the types used
in `createTable` context (primary_key, string, integer, bigint, uuid, datetime,
boolean, etc.) resolve the same way through the adapter's `typeToSql` as through the
hand-rolled switch.

Do NOT modify `AbstractTableDefinition.toSql()` in this step — Step 4 deletes it.

Steps 2 and 3 can be developed in parallel (they touch non-overlapping files:
`sqlite3/schema-definitions.ts` + `sqlite3-adapter.ts` vs `postgresql/schema-definitions.ts`),
but both must land before Step 4.
