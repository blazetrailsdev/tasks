---
title: "exec_insert_all should route through internalExecQuery (impl SQLite castResult)"
status: ready
updated: 2026-06-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 32
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails `DatabaseStatements#exec_insert_all` routes through `internal_exec_query`
(database_statements.rb:176). Our port (`execInsertAll`,
packages/activerecord/src/connection-adapters/abstract/database-statements.ts)
deliberately routes through the adapter's `execQuery` override instead, because
`internalExecQuery` relies on `castResult`, which the SQLite adapter leaves as
an unimplemented strategy hook (throws `NotImplementedError`). Adapters
materialize + type-cast RETURNING rows inside their `execQuery` override, so
that is the only path that works today.

Introduced in PR #3447 (RFC 0030 d2 — insert_all/upsert_all returning →
ActiveRecord::Result).

## Convergence

Implement SQLite `castResult` (and confirm PG/MySQL) so `execInsertAll` can
route through `internalExecQuery` exactly like Rails' `internal_exec_query`,
then drop the divergence comment in `execInsertAll`.

## Acceptance criteria

- [ ] SQLite adapter implements `castResult` rather than throwing.
- [ ] `execInsertAll` routes through `internalExecQuery` (Rails parity).
- [ ] insert-all returning tests still pass on SQLite/PG/MySQL.
