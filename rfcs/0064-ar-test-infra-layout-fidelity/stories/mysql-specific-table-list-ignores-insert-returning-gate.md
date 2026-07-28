---
title: "ADAPTER_SPECIFIC_TABLES.mysql declares a table the loader gates off"
status: claimed
updated: 2026-07-28
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-07-28T23:35:47Z"
assignee: "mysql-specific-table-list-ignores-insert-returning-gate"
blocked-by: null
closed-reason: null
---

## Context

`ADAPTER_SPECIFIC_TABLES.mysql` in
`packages/activerecord/src/support/load-schema-helper.ts` lists
`pk_autopopulated_by_a_trigger_records` unconditionally, but
`loadMysql2SpecificSchema` only creates it inside
`if (adapter.supportsInsertReturning())` — the same
`if supports_insert_returning?` guard Rails uses at
`vendor/rails/activerecord/test/schema/mysql2_specific_schema.rb:84-95`.

On MariaDB the gate is true and the two agree, which is why the mysql CI lane is
green. On MySQL 8 `AbstractMysqlAdapter#supportsInsertReturning`
(`connection-adapters/abstract-mysql-adapter.ts:554-557`) returns false, the
table is never laid, and
`support/load-schema-helper.trails.test.ts`'s "lists tables the active lane
actually has after boot" fails:

    AssertionError: expected [ Array(1) ] to deeply equal []

(verified locally against MySQL 8 on `ARCONN=mysql2`). The bookkeeping also
stops describing the actual boot schema, which is the whole point of the list.
Flagged in review on PR #5534 but merged before the fix landed.

## Acceptance criteria

- `ADAPTER_SPECIFIC_TABLES.mysql` carries `pk_autopopulated_by_a_trigger_records`
  under the same `supportsInsertReturning()` gate the loader applies.
- The gate is evaluated warm — `AbstractMysqlAdapter#supportsInsertReturning`
  reads the lazily-populated `_mariadb` / `_databaseVersion`, so a cold pool
  lease would otherwise answer `false` on MariaDB and leave the table
  unshielded from the between-test drop. `loadMysql2SpecificSchema` warms it
  with `await adapter.getDatabaseVersion()`; the list must do the same.
- Making the arm adapter-aware changes `adapterSpecificTableNames`'s signature
  from `(adapterName: string)` to the live adapter; its one caller is
  `bootLaidTableNames` in `support/drop-all-tables.ts:27`, which is already
  reached from the async `resetTables`, plus the two call sites in
  `load-schema-helper.trails.test.ts`.
- `load-schema-helper.trails.test.ts` passes on both the MySQL 8 and MariaDB
  lanes.

A verified fix (all four points, typecheck-clean, guard test failing before /
passing after on MySQL 8) is pushed as commit `402955f61` on branch
`fix-mysql-specific-table-list-insert-returning-gate` — no PR opened.
