---
title: "activerecord: _create_record passes returning_columns unconditionally"
status: ready
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord"]
deps: ["mysql-returning-column-values-ports-the-super-arm"]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8390 (the `ca-drivers` receipt audit), while confirming who reaches
`returning_column_values`.

`Persistence#_create_record`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb:924-934`) asks for
`returning_columns = self.class._returning_columns_for_insert(connection)` and passes it to
`_insert_record` unconditionally; `_insert_record` (`:238-260`) hands it to
`connection.insert(…, returning: returning)`. `_returning_columns_for_insert`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/model_schema.rb:436-444`) never answers empty: it
falls back to `Array(primary_key)`. So `returning` is always non-nil, and an adapter without `RETURNING`
answers through `returning_column_values`' `super` arm, `[last_inserted_id(result)]`
(`connection_adapters/abstract/database_statements.rb:199,723-725`).

`packages/activerecord/src/persistence.ts` `_createRecord` instead computes
`returning = supportsReturning && returningColumns.length > 0 ? returningColumns : null` from a
`connection.supportsInsertReturning?.()` probe, so on MySQL without `RETURNING` `insert` skips
`returningColumnValues` and goes to `lastInsertedId`, and the write-back below it has a second
`else` arm for the null case. Rails has neither the probe nor the second arm.

`mysql-returning-column-values-ports-the-super-arm` owns the adapter half (the abstract body dispatching
to `lastInsertedId`); this story is the caller half and depends on it.

## Acceptance criteria

- [ ] `_createRecord` passes `returningColumns` to `_insertRecord` as Rails does, with no
      `supportsInsertReturning` probe and no null arm.
- [ ] The write-back is Rails' `returning_columns.zip(returning_values).each { … } if returning_values`
      (`persistence.rb:932-934`).
- [ ] Create tests pass on SQLite, PostgreSQL, MySQL and MariaDB.

## Verification

```bash
pnpm parity:api:calls && pnpm vitest run packages/activerecord/src/persistence.test.ts
```
