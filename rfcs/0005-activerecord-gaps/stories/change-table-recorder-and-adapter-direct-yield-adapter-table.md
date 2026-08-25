---
title: "change-table-recorder-and-adapter-direct-yield-adapter-table"
status: done
updated: 2026-07-30
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5628
claim: "2026-07-30T01:57:13Z"
assignee: "change-table-recorder-and-adapter-direct-yield-adapter-table"
blocked-by: null
closed-reason: null
---

## Context

Split out of `migration-change-table-yields-adapter-table` (PR #5626), which
converged the Migration path only.

Rails routes **every** `change_table` through
`update_table_definition(table_name, base)`:

- `SchemaStatements#change_table` — `yield update_table_definition(table_name,
base)` (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:510-517`).
- `CommandRecorder#change_table` — `yield delegate.update_table_definition(table_name, self)`
  (non-bulk) / `recorder.delegate.update_table_definition(table_name, recorder)`
  (bulk) (`vendor/rails/activerecord/lib/active_record/migration/command_recorder.rb:136-145`).

Two trails paths still diverge:

1. ~~**Adapter-direct.**~~ Landed in #5624 (`PostgreSQL::ColumnMethods` on
   `PostgreSQL::Table`) — kept here only as the record of what was checked.
   `SchemaStatements#changeTable`
   (`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:1019-1063`)
   calls its own `updateTableDefinition` (:1977), which returns the abstract
   `Table`. The PG/MySQL overrides live on the _adapter_ classes
   (`postgresql-adapter.ts:4731`, `abstract-mysql-adapter.ts:271`), not on the
   `PostgreSQLSchemaStatements` / `MysqlSchemaStatements` companions that
   `Migration#schema` and `SchemaStatements#changeTable` actually use — so
   `connection.changeTable` blocks get no PG shorthands. That is why
   `packages/activerecord/src/adapters/postgresql/citext.test.ts` "change table
   supports json" still spells `t.column("username", "citext")` with a TODO
   instead of Rails' `t.citext "username"`.
2. **CommandRecorder.** `CommandRecorder#changeTable`
   (`packages/activerecord/src/migration/command-recorder.ts:108-147`) yields
   `RecorderTableProxy` wrapped in `withAdapterColumnMethods` (:848) — both
   trails inventions. Rails builds a real Table over the recorder as `base`.
   Retiring them means `RecorderTableProxy`'s record shapes (notably `remove`
   emitting one `removeColumn` per name, and `removeIndex` recording the column
   so `invert_remove_index` can reconstruct) must be preserved by the
   recorder-as-`base` implementations of `addColumn`/`removeColumn`/…

## Acceptance criteria

- `CommandRecorder#changeTable` yields `delegate.updateTableDefinition(tableName,
recorder)`; `RecorderTableProxy` and `withAdapterColumnMethods` deleted, with
  `command-recorder.test.ts`'s existing inversion + shorthand coverage
  (`t.serial`/`t.bigserial`, MySQL unsigned/blob, `remove`, `removeIndex`) still
  green and its `withAdapterColumnMethods` describe re-pointed or removed.
- `parity:api` / `parity:test` deltas non-negative.
