---
title: "Implement internalExecQuery/castResult on Mysql2Adapter so query_value/update work"
status: in-progress
updated: 2026-06-15
rfc: "0021-mysql-rawconn-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 3312
claim: "2026-06-15T00:06:59Z"
assignee: "mysql-internal-exec-query-cast-result"
blocked-by: null
---

## Context

`Mysql2Adapter` only overrides `execQuery` (mysql2-adapter.ts:518). The generic
`internalExecQuery`/`query` path calls the freestanding `castResult`
(abstract/database-statements.ts:1672), which throws
`DatabaseStatements#cast_result is not implemented`. So Rails-faithful
`query_value`/`update` (and the stub `execute` in database-statements.ts:424)
do not work on MySQL.

Surfaced in #3177 (F-9c): `AbstractMysqlAdapter#disableReferentialIntegrity`
initially used `queryValue`/`update` per Rails, which threw `cast_result` on
every fixture load (it runs in `doLoadInTransaction`) and broke the entire
MySQL/MariaDB suite. Worked around by routing through `selectValue`/`execute`
(which dispatch to `execQuery`). Implementing `internalExecQuery` + a real
`castResult` for the mysql2 adapter would let MySQL use the Rails-faithful
`query_value`/`update`/`execute` paths directly.

## Acceptance criteria

- [ ] `Mysql2Adapter` implements `internalExecQuery` (and `castResult`/`execute`)
- [ ] `query_value`/`update`/`execute` work on MySQL without throwing
- [ ] revisit the `selectValue`/`execute` workaround in `disableReferentialIntegrity`
- [ ] Read the corresponding Rails test(s) first and mirror names verbatim; add
      coverage for `query_value`/`update`/`execute` on the mysql2 adapter
- [ ] CI green on all three adapters (MySQL path is the one exercised)
- [ ] api:compare / test:compare delta non-negative
