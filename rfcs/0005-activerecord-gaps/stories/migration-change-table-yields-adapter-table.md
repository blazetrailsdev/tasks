---
title: "migration-change-table-yields-adapter-table"
status: done
updated: 2026-07-30
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5626
claim: "2026-07-30T01:22:12Z"
assignee: "migration-change-table-yields-adapter-table"
blocked-by: null
closed-reason: null
---

## Context

Found while shipping `pg-column-methods-on-change-table-proxy` (RFC 0005).

Rails' `change_table` always yields the **adapter's** `Table` subclass — the PG
adapter overrides `update_table_definition`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb`)
so the block object mixes in `PostgreSQL::ColumnMethods`. Migration
`change_table` is no exception: `Migration#change_table` forwards to
`SchemaStatements#change_table`
(`vendor/rails/activerecord/lib/active_record/migration.rb` → `method_missing`
delegation to the connection).

trails' `Migration#changeTable`
(`packages/activerecord/src/migration.ts:973-1009`) instead constructs the
**abstract** `Table` (`new Table(tableName, this)`) and wraps it in
`withAdapterColumnMethods(table, columnTypes)`, where `columnTypes` comes from
`connection.columnMethodNames?.() ?? Object.keys(connection.nativeDatabaseTypes())`.
Two consequences:

1. The synthesized shorthands are keyed off `nativeDatabaseTypes`, which has no
   `serial` / `bigserial` entries, so `t.serial` / `t.bigserial` are simply absent
   on the migration path even though Rails' `ColumnMethods` defines them (and
   trails' `PostgreSQL::Table` now does too).
2. `t.enum` synthesizes `column(name, "enum", opts)` and drops the `enum_type:`
   option, so `typeToSql("enum")` raises `enumType is required for enums`.
   `enum_test.rb`'s `test_schema_load` (ours:
   `packages/activerecord/src/adapters/postgresql/enum.test.ts`, "schema load")
   currently works around this with `t.column("best_color", "color", ...)`, and
   `hstore_test.rb`'s `test_hstore_migration` reaches `hstore` through the proxy
   rather than `PgTable#hstore`.

Adapter-direct `connection.changeTable` already yields the right subclass
(`PostgreSQLAdapter#updateTableDefinition`, postgresql-adapter.ts:4731), so this
is specifically the Migration/Schema path.

## Acceptance criteria

- `Migration#changeTable` yields the adapter's `Table` subclass (via
  `updateTableDefinition`) rather than an abstract `Table` behind
  `withAdapterColumnMethods`, keeping per-operation recording intact.
- `withAdapterColumnMethods` is retired if nothing else needs it (it is a trails
  invention with no Rails counterpart).
- `t.enum` on the migration path honours `enum_type:`; restore
  `enum.test.ts` "schema load" to `t.enum("best_color", { enum_type: "color", ... })`
  and `hstore.test.ts` "hstore migration" to a typed `PgTable#hstore` call,
  dropping the deviation comments both now carry.
- `parity:api` / `parity:test` deltas non-negative.
