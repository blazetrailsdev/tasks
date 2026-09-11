---
title: 'mysqlQuote''s double-quote rewrite masks hand-written "ident" SQL; converge the SQL, then retire it'
status: claimed
updated: 2026-09-11
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: 110
pr: null
claim: "2026-09-11T00:01:04Z"
assignee: "mysql-quote-retirement-needs-hand-written-double-quoted-sql-converged"
blocked-by: null
closed-reason: null
---

## Context

`Mysql2Adapter#mysqlQuote` (`packages/activerecord/src/connection-adapters/mysql2-adapter.ts`, private) is a trails invention. It runs on every statement in `internalExecQuery`, `internalExecute` and `executeMutation`, and has two halves:

- It rewrites a bare `OFFSET` to `LIMIT 18446744073709551615 OFFSET`. This is redundant: the arel MySQL visitor already does it (`vendor/rails/activerecord/lib/arel/visitors/mysql.rb:23-24`, ported at `packages/arel/src/visitors/mysql.ts:29`).
- It rewrites `"` to backticks outside single-quoted literals. Rails has no counterpart: the driver receives the SQL the visitor produced.

PR #7664 retired `mysqlQuote` and turned both MariaDB CI shards red (run 34484577518) with `ER_PARSE_ERROR` on hand-written double-quoted SQL. Failing files:

- `packages/activerecord/src/migration.test.ts` (9), e.g. `INSERT INTO "bk1" ("name", "age", "email") VALUES (…)`
- `packages/activerecord/src/active-record-schema.test.ts` (6), e.g. `INSERT INTO "ts_add" (…)`
- `packages/activerecord/src/unsafe-raw-sql.test.ts` (2): `SELECT \`posts\`.\`id\` FROM \`posts\` ORDER BY "posts"."title"`. The ORDER BY fragment is test-supplied raw SQL.
- `packages/activerecord/src/associations/nested-through-associations.test.ts` (1)
- `packages/activerecord/src/finder.test.ts` (4 placeholder bodies using `'SELECT * FROM "topics"'`). Rails writes bare `topics` (`vendor/rails/activerecord/test/cases/finder_test.rb:186,717-736`).

This story is the AC2 prerequisite of `mysql2-internal-execute-and-exec-query-overrides-rails-lacks`, which is blocked.

## Acceptance criteria

- [ ] Every hand-written SQL string reaching MySQL uses Rails' spelling: the Rails test's literal where one exists (usually unquoted identifiers), or `connection.quoteTableName` / `quoteColumnName` where the Rails test uses them.
- [ ] `mysqlQuote` is deleted, and `internalExecQuery`, `internalExecute` and `executeMutation` pass `sql` straight to `performQuery`.
- [ ] MySQL 8 and MariaDB lanes are green.
