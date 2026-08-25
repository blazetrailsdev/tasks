---
title: "TableDefinition's constructor takes id/primaryKey and calls setPrimaryKey; Rails calls it from buildCreateTableDefinition"
status: done
updated: 2026-08-03
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6033
claim: "2026-08-03T22:50:10Z"
assignee: "move-set-primary-key-call-out-of-table-definition-constructor"
blocked-by: null
closed-reason: null
---

## Context

`TableDefinition`'s constructor
(`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts:1004-1029`)
accepts `id` / `primaryKey` / the primary-key options and calls `setPrimaryKey`
itself. Rails' `TableDefinition#initialize`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:370-393`)
takes none of those — it only takes `conn, name, temporary, if_not_exists,
options, as, comment`. Rails calls `set_primary_key` exactly once, from
`SchemaStatements#build_create_table_definition`
(`schema_statements.rb:333-340`), right after constructing the definition.

PR #5993 converged the double invocation and the guard, but chose the
constructor as the single call site because trails callers construct
`TableDefinition` directly with `id`/`primaryKey`. That leaves the constructor
option surface (`id`, `primaryKey`, `limit`, `default`, `precision`, `unsigned`,
`autoIncrement`) as invented, and forces `buildCreateTableDefinition` to funnel
the primary-key options through the same hash instead of passing them as
`set_primary_key`'s own kwargs.

## Converged shape

- `TableDefinition`'s constructor takes only Rails' parameters and makes no
  `setPrimaryKey` call.
- `buildCreateTableDefinition` calls `tableDefinition.setPrimaryKey(tableName,
id, primaryKey, pkOptions)` once, after construction, mirroring
  `schema_statements.rb:335`.
- Direct `new TableDefinition(..., { id, primaryKey })` callers (tests, SQLite
  copy-table, adapter schema-creation paths) route through
  `buildCreateTableDefinition`/`createTable` or call `setPrimaryKey` explicitly.

## Acceptance criteria

- [ ] `TableDefinition`'s constructor signature matches
      `schema_definitions.rb:370-393` and calls nothing.
- [ ] `set_primary_key` is invoked from `buildCreateTableDefinition` only.
- [ ] `pnpm parity:api:extra --package activerecord` shows no new novel surface on
      `connection-adapters/abstract/schema-definitions.ts`.
