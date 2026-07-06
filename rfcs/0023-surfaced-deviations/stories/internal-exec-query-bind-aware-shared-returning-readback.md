---
title: "Make internalExecQuery bind-aware and collapse per-adapter RETURNING read-back"
status: in-progress
updated: 2026-07-06
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 4684
claim: "2026-07-06T16:16:59Z"
assignee: "internal-exec-query-bind-aware-shared-returning-readback"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while implementing `insert-read-back-auto-populated-columns` (PR #4659).

Rails' abstract `exec_insert` runs `sql_for_insert` then `internal_exec_query`,
which is bind-aware and returns the full RETURNING row
(`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb`).
trails' module `internalExecQuery`
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts`,
~line 1368) is NOT bind-aware: when `this.internalExecute` exists (PG, MySQL) it
calls `this.internalExecute(sql, name)` and DROPS the `binds` argument — a bound
`INSERT ... RETURNING` fails with "there is no parameter $1" on PG and a syntax
error on MariaDB. Only SQLite's `internalExecQuery` override is bind-aware
(`.all(driverBinds)`).

Because of this, PR #4659 could not route the multi-column RETURNING read-back
through a single shared path. Instead it added three near-identical
`execInsert` overrides:

- `postgresql-adapter.ts` (~2330): `withRawConnection` + `_instrumentedQueryOnClient`
- `sqlite3-adapter.ts` (~632): `internalExecQuery` (bind-aware) + manual `dirtyCurrentTransaction`
- `mysql2-adapter.ts` (~513): `execQuery`
  plus two `dirtiesQueryCache(..., "execInsert")` registrations.

## Acceptance criteria

- [ ] `internalExecQuery` threads `binds` through to the adapter's execute path
      (matching Rails `internal_exec_query(sql, name, binds)`), OR a documented
      bind-aware shared primitive exists that materializes + dirties the
      transaction and returns a full `Result` on PG/SQLite/MySQL.
- [ ] The three per-adapter multi-column RETURNING `execInsert` overrides added
      in PR #4659 collapse to (or delegate to) that shared path, removing the
      duplication while keeping all four backends (SQLite, PG, MySQL 8, MariaDB 11)
      green on `fills auto populated columns on creation`.
- [ ] Single-column / no-RETURNING inserts keep the `executeMutation` fast path
      (prepared-statement-cache retry, `lastInsertRowid`).
