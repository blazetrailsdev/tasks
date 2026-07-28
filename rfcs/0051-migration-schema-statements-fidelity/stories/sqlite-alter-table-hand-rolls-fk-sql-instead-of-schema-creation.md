---
title: "SQLite alterTable concatenates rebuild DDL by hand instead of going through schemaCreation"
status: in-progress
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 5487
claim: "2026-07-28T02:34:18Z"
assignee: "sqlite-alter-table-hand-rolls-fk-sql-instead-of-schema-creation"
blocked-by: null
closed-reason: null
---

## Context

Root cause of two of the four fidelity fixes in PR #5307 (ported
`foreign_key_test.rb:209-330`).

`AbstractSQLite3Adapter#alterTable`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:2377`) rebuilds
the table by **string-concatenating** column, FK and CHECK SQL by hand:

```ts
fkSql += `CONSTRAINT ${quoteColumnName(fkName)} `;
fkSql += `FOREIGN KEY(${colList}) REFERENCES ${quoteTableName(fk.toTable)}(${pkList})`;
if (fk.onDelete) fkSql += ` ON DELETE ${normalizeReferentialAction(fk.onDelete)}`;
```

Rails instead builds a real definition and runs it through the normal visitor:
`alter_table` → `move_table` → `copy_table` (`sqlite3_adapter.rb:593-640`) calls
`create_table(to, ...)` with a block that populates a `TableDefinition`
(`@definition.column(...)`, `definition.foreign_key(...)`,
`definition.check_constraint(...)`), so every rebuild goes through
`schema_creation` — the same path as any other CREATE TABLE.

Consequences already observed (both patched locally in #5307 rather than fixed
at the root):

- Unsupported `on_delete` / `on_update` values reached SQLite as literal SQL
  (`ON DELETE INVALID` → syntax error) instead of raising `ArgumentError`,
  because `actionSql` was never called. Patched by making
  `normalizeReferentialAction` throw — a second, parallel implementation of
  `actionSql`'s validation.
- A missing source table produced a column-less `CREATE TABLE` and a raw
  `SqliteError`. Rails gets `StatementInvalid: Could not find table 'x'` for
  free because `copy_table` calls `primary_key(from)` → `table_structure`.
  Patched with an explicit empty-`tableInfo` guard in `alterTable`.

The hand-rolled builder also duplicates quoting, PK, collation, generated-column
and DEFAULT logic that `SchemaCreation` already implements, and is where
`REFERENTIAL_ACTION_MAP` (a second copy of `actionSql`'s table) lives.

Related: `sqlite-change-column-table-rebuild` (done) touched the same method;
`action-sql-referential-action-set-and-message-parity` covers the duplicated
action table.

## Acceptance criteria

- [ ] `alterTable` builds a `TableDefinition` and emits DDL via
      `schemaCreation.accept(...)` (Rails' `copy_table` → `create_table` shape)
      rather than concatenating column/FK/CHECK SQL strings.
- [ ] `normalizeReferentialAction` / `REFERENTIAL_ACTION_MAP` are deleted in
      favour of `actionSql`, so referential-action validation exists once.
- [ ] The missing-table guard added in #5307 is either removed (because
      `primary_key(from)`/`columns(from)` now raises it naturally, as in Rails)
      or kept with a comment explaining why the natural path doesn't reach it.
- [ ] Green on all three adapters, in particular
      `migration/foreign-key.test.ts`, `sqlite3-copy-table.test.ts`,
      `connection-adapters/abstract/schema-statements-on-adapter.test.ts` and
      `schema-dumper.test.ts`.
