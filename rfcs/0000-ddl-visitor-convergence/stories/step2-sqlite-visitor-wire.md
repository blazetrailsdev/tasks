---
title: "Step 2 — Wire SQLite createTableDefinition + SQLite3TableDefinition.toSql() through visitor"
status: draft
updated: 2026-06-08
rfc: "0000-ddl-visitor-convergence"
cluster: ddl-visitor-convergence
deps:
  - step1-delete-dead-mysql-branches
deps-rfc: []
est-loc: 120
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`SQLite3Adapter` does not override `createTableDefinition`, so both
`SchemaStatements.createTable` and `MigrationContext.createTable` fall through to the
mixin's default, which returns a base `AbstractTableDefinition`. The base `toSql()`
(hand-rolled) then handles DDL, producing different output from the
`SQLite3SchemaCreation` visitor in three ways: SQLite generated columns throw instead
of emitting `GENERATED ALWAYS AS`, FK deferrable throws instead of appending
`DEFERRABLE INITIALLY`, and `DEFAULT`/`NOT NULL` order is inverted.

The building blocks already exist:

- `sqlite3/schema-definitions.ts` — `SQLite3TableDefinition` (no `toSql()` override)
- `sqlite3/schema-creation.ts` — `SQLite3SchemaCreation` (handles collation, generated
  columns, FK deferrable)
- `sqlite3/schema-statements.ts:132` — a dead internal `createTableDefinition()`
  function that creates a `SQLite3TableDefinition` (never wired up)

This story wires them together.

## Acceptance criteria

- [ ] `SQLite3Adapter` overrides `createTableDefinition(name, options)` (in
      `sqlite3-adapter.ts`) to return a `new SQLite3TableDefinition(name, options)`.
      This mirrors `AbstractMysqlAdapter.createTableDefinition` and
      `PostgreSQLAdapter.createTableDefinition`. See RFC §Open questions item 3 for
      rationale on defining it on the adapter class rather than promoting the dead
      function in `schema-statements.ts`.
- [ ] `sqlite3/schema-definitions.ts:SQLite3TableDefinition` adds a `toSql()` override
      that calls the visitor:
      `typescript
override toSql(): string {
    return new SQLite3SchemaCreation("sqlite", this._adapter).accept(this);
}
`
      `this._adapter` is the `SchemaQuoter` stored by `AbstractTableDefinition`'s
      constructor (verify the field name before coding — it is `_adapter` in
      `abstract/schema-definitions.ts:638-649`).
- [ ] The dead internal `createTableDefinition` function in
      `sqlite3/schema-statements.ts:132` is deleted.
- [ ] `pnpm tsc --build` clean.
- [ ] All of the following test files pass: - `sqlite3/schema-definitions.test.ts` (if it exists) - `sqlite3/schema-creation.test.ts` - `abstract/schema-definitions.test.ts`
- [ ] Representative SQLite integration: `pnpm vitest run packages/activerecord/src/migration/schema.test.ts`
      and `pnpm vitest run packages/activerecord/src/connection-adapters/sqlite3-copy-table.test.ts`
      pass in isolation (not the full suite).
- [ ] SQLite generated-column round-trip: add or un-skip a test that calls
      `createTable` with `t.column("expr", "integer", { as: "x + 1", stored: true })`
      on SQLite and verifies the emitted SQL contains `GENERATED ALWAYS AS (x + 1) STORED`
      (previously would have thrown from the hand-rolled path).

## Notes

The `SQLite3TableDefinition` constructor currently takes `{ id?: boolean | "uuid" }`.
If `SQLite3Adapter.createTableDefinition` passes richer options from
`MigrationContext.createTable` (charset, collation, comment, etc.), confirm that
`AbstractTableDefinition`'s constructor accepts them and that `SQLite3TableDefinition`
passes them through. SQLite ignores charset/collation at the table level — those
options are no-ops on SQLite, so they should be forwarded to `super()` and silently
dropped by the visitor (which only handles them via MySQL-specific visitor overrides).

When constructing the visitor inside `toSql()`, passing `this._adapter` ensures the
same quoting behavior as the rest of the adapter stack. Do NOT construct a bare
`new SQLite3SchemaCreation("sqlite")` without the adapter argument — that uses the
abstract quoting fallback instead of the adapter's actual quoter.

Do not touch `AbstractTableDefinition.toSql()` in this step — Step 4 deletes it.
