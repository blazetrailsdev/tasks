---
title: "mysql2-internal-execute-and-exec-query-overrides-rails-lacks"
status: blocked
updated: 2026-09-10
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 130
pr: null
claim: "2026-09-10T13:19:53Z"
assignee: "mysql2-internal-execute-and-exec-query-overrides-rails-lacks"
blocked-by: 'Two blockers. (1) AC1/AC3: RFC 0076 awaitable exception-translation path, same as mysql-mismatched-fk-details-omits-primary-key-column. The two overrides are the only async site running _enrichMismatchedForeignKey (column_for, abstract_mysql_adapter.rb:995); deleting them reds the 5 mysql2_adapter_test.rb ''which has type'' tests (:145,:171,:201,:229,:258). (2) AC2: retiring mysqlQuote reds both MariaDB shards (PR #7664, CI run 34484577518). The OFFSET half is redundant (arel/visitors/mysql.rb:23-24 already ported), but the double-quote to backtick half is load-bearing for hand-written SQL with double-quoted identifiers across migration.test.ts (9), active-record-schema.test.ts (6), unsafe-raw-sql.test.ts (2), nested-through-associations.test.ts (1), plus 4 finder.test.ts placeholder bodies (Rails writes bare topics, finder_test.rb:186,717-736), and at least one src-generated ORDER BY "posts"."title". Converge those SQL literals to Rails'' spelling first, then drop mysqlQuote.'
closed-reason: null
---

## Context

Rails' mysql2 adapter defines neither `internal_execute` nor `internal_exec_query`
— `grep -n "def internal_exec" vendor/rails/activerecord/lib/active_record/
connection_adapters/mysql2_adapter.rb mysql2/database_statements.rb
abstract_mysql_adapter.rb` is empty. Both come from
`abstract/database_statements.rb:594-604,540-546` and reach the driver through
`raw_execute` → `perform_query`.

trails overrides both on `Mysql2Adapter`
(`packages/activerecord/src/connection-adapters/mysql2-adapter.ts`, the
`internalExecQuery` and `internalExecute` members). Each re-implements the
abstract body — `log` + `withRawConnection` + `performQuery` — with two
additions the abstract path does not have:

- `mysqlQuote(sql)` (`mysql2-adapter.ts`, private), a trails invention that
  rewrites `"` to backticks and reorders a bare `OFFSET`. Rails has no such
  method; the driver SQL Rails sends is the SQL the visitor produced.
- a bespoke `try/catch` calling `_translateAndEnrich(e, driverSql, binds)`,
  where the abstract path already translates in `withRawConnection`
  (`connection-adapters/abstract-adapter.ts`, the `translateExceptionClass`
  call inside its retry loop) and in `log`.

PR for `mysql2-execute-override-only-shapes-driver-rows` deleted
`Mysql2Adapter#execute` so `execute` now returns the driver result object Rails'
returns, but left these two overrides in place: folding them requires first
retiring `mysqlQuote`, which is a separate divergence with its own blast radius
across every mysql SQL string in the suite.

## Acceptance criteria

- [ ] `Mysql2Adapter#internalExecute` and `#internalExecQuery` are gone; the
      abstract bodies serve mysql2, so `execute` reaches `rawExecute`.
- [ ] `mysqlQuote` is retired, or its need is established at the seam Rails has
      (the visitor / quoting layer) rather than inside a statement override.
- [ ] The bespoke `_translateAndEnrich` try/catch is dropped in favour of the
      abstract translation path, or the gap in that path is fixed.
- [ ] MySQL and MariaDB lanes green; `pnpm parity:api:extra:gate` does not grow.
