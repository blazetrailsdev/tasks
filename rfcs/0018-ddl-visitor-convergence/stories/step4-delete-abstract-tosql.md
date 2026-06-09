---
title: "Step 4 — Delete AbstractTableDefinition.toSql()"
status: ready
updated: 2026-06-08
rfc: "0018-ddl-visitor-convergence"
cluster: ddl-visitor-convergence
deps:
  - step2-sqlite-visitor-wire
  - step3-pg-tosql-via-visitor
deps-rfc: []
est-loc: 50
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

After steps 2 and 3, `AbstractTableDefinition.toSql()` is unreachable:

- MySQL: `MysqlTableDefinition.toSql()` calls the visitor; never calls `super.toSql()`
- PG: `PgTableDefinition.toSql()` calls `PgSchemaCreation.accept(this)`; no more `super.toSql()`
- SQLite: `SQLite3TableDefinition.toSql()` calls `SQLite3SchemaCreation.accept(this)`

This step deletes the method and migrates the one test that relies on it directly.

## Acceptance criteria

- [ ] `AbstractTableDefinition.toSql()` deleted from
      `packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts`.
- [ ] The blank-type guard ("Column X has an empty or blank type") currently at
      ~L1161–1165 in `toSql()` is moved to `SchemaCreation.typeToSql`
      (`abstract/schema-creation.ts`): in the `default` branch, before returning
      `String(type).toUpperCase()`, throw when `!type || !String(type).trim()`.
- [ ] `abstract/schema-definitions.test.ts` — the two tests in
      `describe("TableDefinition#toSql blank type guard")` are migrated to call the
      visitor directly (e.g. via `new SchemaCreation("sqlite").accept(td)`) rather than
      `td.toSql()`.
- [ ] Any other test directly asserting `AbstractTableDefinition#toSql` output is
      migrated to use the appropriate dialect visitor instead.
- [ ] `migration.ts:MigrationContext.createTable` is updated to call the visitor
      directly instead of `this.connection.toSql(td)`. Once `toSql()` is removed from
      `AbstractTableDefinition`, the `typeof (node as any).toSql === "function"` check
      in `database-statements.ts:174` returns `false` and the call errors at runtime.
      The replacement call is `this.connection.schemaCreation.accept(td)`.
- [ ] The `_mysqlInlineIndexSql` private method on `AbstractTableDefinition` (used only
      within `toSql()`) is deleted if it is no longer called.
- [ ] `pnpm tsc --build` clean.
- [ ] All of the following test files pass:
  - `abstract/schema-definitions.test.ts`
  - `abstract/schema-creation.test.ts` (blank-type guard test added here)
  - `sqlite3/schema-definitions.test.ts`
  - `postgresql/schema-definitions.test.ts`
  - `mysql/schema-creation.test.ts`

## Notes

Check for any remaining import of `toSql` on `TableDefinition` in the TypeScript
interface (`adapter.ts:454`):

```typescript
createTableDefinition?(name: string, options?: Record<string, unknown>): TableDefinition;
```

The return type is `TableDefinition`. If callers invoke `td.toSql()` on the return
value (e.g. in `MigrationContext.createTable:1935` via `this.connection.toSql(td)`
→ `database-statements.ts:174` → `(td as any).toSql()`), TypeScript won't catch
the deletion until the type system notices. After deletion, `(td as any).toSql()` would
throw at runtime. Verify that `database-statements.ts:toSql` falls through correctly:
once `toSql()` is removed from `AbstractTableDefinition`, the
`typeof (node as any).toSql === "function"` check at `database-statements.ts:174`
returns `false`, and it proceeds to `toSqlAndBinds` which produces an error
("cannot convert TableDefinition to SQL").

The correct fix for `MigrationContext.createTable:1935` — change from:

```typescript
await this.connection.executeMutation(this.connection.toSql(td));
```

to:

```typescript
await this.connection.executeMutation(this.connection.schemaCreation.accept(td));
```

This is the final cleanup that makes `MigrationContext.createTable`'s DDL path
structurally identical to `SchemaStatements.createTable`.
