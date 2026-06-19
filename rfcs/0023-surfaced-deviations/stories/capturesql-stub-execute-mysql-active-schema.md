---
title: "captureSql executes DDL instead of stubbing execute like Rails ActiveSchemaTest"
status: done
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 3646
claim: "2026-06-19T14:48:26Z"
assignee: "capturesql-stub-execute-mysql-active-schema"
blocked-by: null
---

## Context

Rails' `ActiveSchemaTest`
(`activerecord/test/cases/adapters/abstract_mysql_adapter/active_schema_test.rb`)
stubs `execute`/`execute_batch` in `setup` so `create_table`, `add_index`,
etc. only **instrument and return the SQL string** — the DDL never hits the
DB. Tests that need real execution opt in via `with_real_execute`
(only `test_add_timestamps` / `test_remove_timestamps`).

Our `captureSql` (`packages/activerecord/src/testing/sql-capture.ts`) instead
subscribes to `sql.active_record` and **actually executes** `fn()`, swallowing
any error in a `catch`. For the active-schema assertions this means we issue
real `CREATE TABLE` / `CREATE INDEX` statements that error out (missing
columns/tables) and get silently dropped. Consequences:

- Fidelity gap: we execute where Rails stubs.
- mysql:8 DDL cost: each captured create/alter is a real round-trip
  (project memory: mysql:8 is ~2.5x slower on DDL).
- Forces awkward teardown: `active-schema.test.ts` "indexes in create" needed
  a guarded `dropTable("temp", { ifExists: true })` purely to satisfy the
  static `require-table-teardown` rule for a table Rails never creates
  (PR #3556).

Surfaced while burning down require-table-teardown
(require-table-teardown-burndown-schema-statements, PR #3556).

## Acceptance criteria

- [ ] `captureSql` (or a sibling helper) supports a true stub mode that
      intercepts `execute`/`executeMutation` to instrument-and-return SQL
      without hitting the DB, mirroring Rails' `setup` stub.
- [ ] `active-schema.test.ts` SQL-assertion tests use the stub mode; the
      `with_real_execute` cases (add/remove timestamps) keep real execution
      with their named drops.
- [ ] The `dropTable("temp", { ifExists: true })` teardown crutch is removed
      once `temp` is no longer really created.
- [ ] No regression in api:compare / test:compare; mysql:8 DDL load reduced.
