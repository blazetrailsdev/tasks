---
title: "activerecord: MySQL::SchemaDumper drops the invented schema_scale override and bigint operand"
status: draft
updated: 2026-10-04
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Seen while converging `connection-adapters/mysql/schema-dumper.ts` in trails PR 8485. Two bodies there still
deviate from `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql/schema_dumper.rb`,
and neither was a row of that story's arms report:

- `isDefaultPrimaryKey` is `(super.isDefaultPrimaryKey(column) || /^bigint\b/i.test(column.sqlType ?? "")) && column.isAutoIncrement() && !column.isUnsigned()`.
  Rails' `default_primary_key?` (`mysql/schema_dumper.rb:32-34`) is `super && column.auto_increment? && !column.unsigned?`.
  The `|| /^bigint\b/i` operand is invented: `super` is `schema_type(column) == :bigint`
  (`abstract/schema_dumper.rb:38-40`), and `schema_type` already answers `:bigint` for `column.bigint?`
  (`abstract/schema_dumper.rb:54-60`). The sibling `bigint` arms in `schemaType` and `schemaLimit` were
  redundant for the same reason and were deleted in PR 8485 with no test change.
- `schemaScale` is overridden to answer `undefined` unless `column.type === "decimal"`. Rails'
  `MySQL::SchemaDumper` defines no `schema_scale`; the inherited body is `column.scale.inspect if column.scale`
  (`abstract/schema_dumper.rb:82-84`). The override is an invented method. If removing it emits a `scale:`
  for a non-decimal column, the fault is upstream in how the MySQL column's `scale` is reflected
  (Rails reads it from the cast type, `SqlTypeMetadata`), and that is where the fix belongs.

## Acceptance criteria

- [ ] `isDefaultPrimaryKey` is `super.isDefaultPrimaryKey(column) && column.isAutoIncrement() && !column.isUnsigned()`.
- [ ] The `schemaScale` override is deleted from `mysql/schema-dumper.ts`; any column whose `scale` then
      dumps wrongly is fixed where the scale is reflected, not by a dumper guard.
- [ ] `schema-dumper.test.ts` and `adapters/abstract-mysql-adapter/**` pass with `ARCONN=mysql2`.

## Verification

```bash
pnpm parity:api:extra --package activerecord && pnpm parity:api:arms:report --package=activerecord | grep mysql/schema-dumper
```
