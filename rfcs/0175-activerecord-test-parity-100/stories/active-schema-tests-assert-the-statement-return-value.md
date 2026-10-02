---
title: "activerecord: ActiveSchemaTest asserts the statement's return value, as Rails' stubbed execute lets it"
status: draft
updated: 2026-10-02
rfc: "0175-activerecord-test-parity-100"
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

Surfaced by trails#8398, which made the adapter schema statements return the `execute` result as Rails does.

Rails' `ActiveSchemaTest` stubs `execute` to instrument and **return the SQL string** (`vendor/rails/v8.0.2/activerecord/test/cases/adapters/abstract_mysql_adapter/active_schema_test.rb:9-22`, and the PostgreSQL twin `test/cases/adapters/postgresql/active_schema_test.rb`), and its tests assert on the statement's return value:

```ruby
assert_equal "CREATE DATABASE `luca` DEFAULT CHARACTER SET `latin1`", recreate_database(:luca, charset: "latin1")
```

(`abstract_mysql_adapter/active_schema_test.rb:137-140`; likewise `add_index` at `:31`, `create_table` at `:86`, `drop_table` at `:118`, `add_column` at `:143`.)

trails' stub, `installExecuteStub` in `packages/activerecord/src/testing/sql-capture.ts:10-30`, returns `Promise.resolve([])`, and `packages/activerecord/src/adapters/abstract-mysql-adapter/active-schema.test.ts` and `adapters/postgresql/active-schema.test.ts` assert on the SQL `captureSql` collected (`sqls[0]`, `sqls[sqls.length - 1]`) instead. So no test in the MySQL or PostgreSQL lane reads the return values trails#8398 added; `connection-adapters/abstract/schema-statements-on-adapter.trails.test.ts` covers `createDatabase` / `recreateDatabase` offline and the rest only on SQLite.

## Acceptance criteria

- [ ] The stubbed `execute` returns `sql`, as `active_schema_test.rb:13-19` does.
- [ ] Each ActiveSchemaTest test asserts what its Rails test asserts: the return value of the statement where Rails uses `assert_equal sql, statement(...)`.
- [ ] `pnpm parity:test:assertions` does not regress for the two files.
