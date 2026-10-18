---
title: "pg-server-error-result-is-a-pg-result"
status: ready
updated: 2026-10-18
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 64
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8787 made `PG.Error` a class (`vendor/pg/v1.5.9/lib/pg/exceptions.rb:9-15`) that
`packages/activerecord/src/pg/connection.ts` raises. A `PG.ServerError`'s `result` is a plain
`{ errorField, resultErrorField }` object built in `pgError` from the node-pg `DatabaseError`'s
`code` and `routine`. In the gem it is the `PG::Result` the failed command returned
(`ext/pg_result.c`, `pg_result_check`), whose `error_field` / `result_error_field` read any
`PG_DIAG_*` field.

`packages/activerecord/src/pg/result.ts`'s `Result` is built from a `pg.QueryResult` and has no
`errorField`. `PostgreSQLAdapter#translateException`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:804`)
and `isCachedPlanFailure` read the literal.

## Acceptance criteria

- [ ] `PG.Result` answers `errorField` / `resultErrorField`, and a `PG.ServerError` raised by
      `pg/connection.ts` carries a `PG.Result` as `result`, not an object literal.
- [ ] Every `PG_DIAG_*` field node-pg's `DatabaseError` exposes is readable through it, not only
      `PG_DIAG_SQLSTATE` and `PG_DIAG_SOURCE_FUNCTION`.
