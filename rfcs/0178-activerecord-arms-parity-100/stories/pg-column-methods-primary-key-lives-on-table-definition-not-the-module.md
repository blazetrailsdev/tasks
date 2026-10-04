---
title: "activerecord: ColumnMethods#primary_key is a class member, not a mixed-in module, so PG Table misses the uuid default"
status: draft
updated: 2026-10-04
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced reviewing trails#8486. Rails defines `primary_key` inside `module ColumnMethods` and includes that
module into each table class:

- `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:308-310`
  (`ColumnMethods#primary_key`), included at `:367` (TableDefinition) and `:716` (Table).
- `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/schema_definitions.rb:48-54`
  (PG `ColumnMethods#primary_key`, the uuid `gen_random_uuid()` default), included at `:246`
  (TableDefinition), `:304` (Table) and into AlterTable.

In trails `ColumnMethods` is a type-only `interface` merged onto each class, and the method bodies sit on
the classes:

- `packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts` — `TableDefinition#primaryKey`
  and `Table#primaryKey` are separate class members.
- `packages/activerecord/src/connection-adapters/postgresql/schema-definitions.ts` — trails#8486 added the
  uuid override as `TableDefinition#primaryKey` only, so PG's `Table` (change_table) does not get the
  uuid default Rails gives it through the shared module.

## Acceptance criteria

- [ ] `ColumnMethods` is a module mixed in with `include()` in the abstract and PostgreSQL files, holding
      `primaryKey` once, in Rails' member order.
- [ ] PG `Table#primaryKey("id", "uuid")` gets the `gen_random_uuid()` default, with a test.
- [ ] `pnpm parity:api` and `pnpm parity:api:extra:gate` stay clean.
