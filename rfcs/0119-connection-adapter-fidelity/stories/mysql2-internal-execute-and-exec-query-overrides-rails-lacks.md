---
title: "mysql2-internal-execute-and-exec-query-overrides-rails-lacks"
status: ready
updated: 2026-09-10
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 130
pr: null
claim: null
assignee: null
blocked-by: null
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
