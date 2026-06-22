---
title: "Schema dumper reflects PG/SQLite expression-column defaults"
status: ready
updated: 2026-06-20
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activerecord/src/defaults.test.ts` has two "schema dump includes
default expression" tests now gated by adapter (`describeIfPg`
PostgresqlDefaultExpressionTest, `describeIfSqlite` Sqlite3DefaultExpressionTest)
but `it.skip`-pending. The schema dumper does not reflect expression defaults
(`CURRENT_DATE` / `CURRENT_TIMESTAMP` on PG; `CURRENT_DATE` / `CURRENT_TIMESTAMP`
/ `ABS(RANDOM())` on SQLite): `dump_table_schema` does not preserve
expression-default lambdas for these adapters. Rails: `defaults_test.rb:148`
(PostgresqlDefaultExpressionTest) and `:309` (Sqlite3DefaultExpressionTest),
backed by `postgresql_specific_schema.rb` / `sqlite_specific_schema.rb`
`defaults` tables. No open tracking story.

## Acceptance criteria

- [ ] Schema dumper reflects PG and SQLite expression-column defaults as
      `default: () => "..."` lambdas.
- [ ] Drop the `it.skip` in both adapter-gated describes; tests assert the dumped
      expression default.
- [ ] `test:compare` delta non-negative; test names unchanged.
