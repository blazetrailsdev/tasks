---
title: "execQuery/execInsert/select bypass the adapter's internalExecQuery override"
status: done
updated: 2026-08-09
rfc: "0076-execute-primitive-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6292
claim: "2026-08-09T19:19:19Z"
assignee: "reset-column-information-leaves-sync-readers-cold"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging the schema catalog probes (PR #5846).

Ruby's `internal_exec_query(...)` is a virtual call: `exec_query`,
`exec_insert` and `select` in
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb`
dispatch to the adapter subclass's override (e.g. SQLite3Adapter's
bind-aware, statement-pooling `internal_exec_query`).

trails' module-level ports call the module-level function directly instead
of going through the instance, so an adapter override is silently dropped:

- `execQuery` — `packages/activerecord/src/connection-adapters/abstract/database-statements.ts:526`
- `execInsert` — same file:550
- `select` — same file:2170

`query` had the identical defect and was fixed in PR #5846 by dispatching
through `(this.internalExecQuery ?? internalExecQuery).bind(this)` — the same
pattern `sendInsert` already uses at :590. The symptom there was concrete:
`queryValues` got an undefined `rows` on SQLite because the module-level
fallback ran instead of `BetterSQLite3Adapter#internalExecQuery`.

## Acceptance criteria

- `execQuery`, `execInsert` and `select` dispatch `internalExecQuery` through
  the instance so an adapter override wins, matching Ruby's virtual call.
- A regression test that fails on baseline: an adapter whose
  `internalExecQuery` override is observable (e.g. records the call or returns
  a distinguishable Result) is reached through each of the three entry points.
- No behaviour change for adapters without an override — the module-level
  function stays the fallback.
