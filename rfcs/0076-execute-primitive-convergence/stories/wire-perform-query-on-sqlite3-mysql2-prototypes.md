---
title: "sqlite3 + mysql2 expose performQuery on the prototype with Rails' signature"
status: ready
updated: 2026-08-09
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `raw_execute` funnels `perform_query(conn, sql, binds, type_casted_binds,
prepare:, notification_payload:, batch:)`
(`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:552-559`),
and every adapter defines `perform_query` with that signature
(abstract:561, postgresql:135, mysql2:41, sqlite3:78).

In trails only PostgreSQL assigns it to the prototype
(`postgresql-adapter.ts:5028`). sqlite3 and mysql2 keep trails-shaped **private**
copies:

- `sqlite3-adapter.ts:515` — `private _performQuery = sqlitePerformQuery`,
  called as `this._performQuery(sql, driverBinds, payload)`.
- `mysql2-adapter.ts:929` — `private async _performQuery(conn, sql, binds,
driverBinds, payload)`.

So `AbstractAdapter#rawExecute` (`abstract/database-statements.ts:1847`), which
calls `this.performQuery`, hits the abstract `NotImplementedError` stub on both
adapters. That is the live blocker for
`converge-execute-batch-through-raw-execute` (blocked 2026-08-09) and for any
other story that wants the Rails raw path.

## Acceptance criteria

- [ ] sqlite3 and mysql2 expose `performQuery` on the prototype with the Rails
      argument list and order, as PostgreSQL already does.
- [ ] The existing private call sites route through it; no `_performQuery`
      remains as a separate signature.
- [ ] `rawExecute` succeeds on all three adapters (prove it with a direct
      `rawExecute` call in an adapter test, not only through `internalExecute`).
- [ ] api:compare / test:compare delta non-negative; all three lanes green.
