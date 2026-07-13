---
title: "PostgreSQL execInsert must dirty the query cache on multi-column RETURNING read-back"
status: in-progress
updated: 2026-07-13
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: 4843
claim: "2026-07-13T19:08:24Z"
assignee: "pg-execinsert-dirties-query-cache-on-returning-readback"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while implementing `internal-exec-query-bind-aware-shared-returning-readback` (PR #4684).

MySQL and SQLite register their `execInsert` override with the query-cache
dirtier — `dirtiesQueryCache(Mysql2Adapter, "execInsert")`
(`mysql2-adapter.ts:2098`) and `dirtiesQueryCache(AbstractSQLite3Adapter,
"execInsert")` (`sqlite3-adapter.ts:3196`) — but PostgreSQL registers only
`executeMutation` (`postgresql-adapter.ts:5119`), NOT `execInsert`.

The multi-column RETURNING read-back (`execInsertReturningReadback`, PR #4684)
runs through `internalExecQuery`, bypassing `executeMutation`. On MySQL/SQLite
the `execInsert` wrapper still dirties the cache; on PG nothing does. So a bound
multi-column `INSERT ... RETURNING` inside an open query-cache scope on PG does
not clear the SELECT query cache, where Rails dirties the cache on every write.

This is a pre-existing asymmetry (PG's read-back in PR #4659 also bypassed
`executeMutation`), surfaced — not introduced — by PR #4684.

## Acceptance criteria

- [ ] A bound multi-column `INSERT ... RETURNING` on PostgreSQL dirties the
      query cache (register `dirtiesQueryCache(PostgreSQLAdapter, "execInsert")`
      or otherwise clear the cache on the read-back path), matching MySQL/SQLite.
- [ ] Regression test: a cached SELECT issued after such an insert on PG returns
      the fresh rows, not a stale cached result.
- [ ] Confirm no double-dirty for the single-column / `executeMutation` fast path.
