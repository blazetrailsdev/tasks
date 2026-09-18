---
title: "remove-columns-for-alter-takes-array-not-splat"
status: closed
updated: 2026-09-18
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "fixed in #7870"
---

## Context

`Table#remove(*column_names)` (`abstract/schema_definitions.rb:829`) forwards splatted names, and
`remove_columns_for_alter(table_name, *column_names, **options)` (`abstract/schema_statements.rb`, search `def remove_columns_for_alter`)
takes them splatted. trails' `removeColumnsForAlter(tableName, columnNames: string[], ...)`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:1851`) takes an array, so
`t.remove("a", "b")` inside `changeTable(..., { bulk: true })` (via `bulkChangeTable`, `:1352`) throws
`columnNames.map is not a function` on PostgreSQL and MariaDB.

Parked as `it.skip` in `packages/activerecord/src/migration.test.ts`: `BulkAlterTableMigrationsTest` "removing columns" and "adding timestamps"
(`vendor/rails/activerecord/test/cases/migration_test.rb:1290`, `:1310`).

## Acceptance criteria

- `removeColumnsForAlter` takes `...columnNames` (+ trailing options) like Rails; callers updated.
- The two parked tests are un-skipped and green on PG and MariaDB.
