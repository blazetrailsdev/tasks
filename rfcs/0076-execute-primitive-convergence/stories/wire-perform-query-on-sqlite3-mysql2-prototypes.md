---
title: "sqlite3 + mysql2 expose performQuery on the prototype with Rails' signature"
status: done
updated: 2026-08-10
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6327
claim: "2026-08-10T09:46:32Z"
assignee: "wire-perform-query-on-sqlite3-mysql2-prototypes"
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
- [ ] `rawExecute` succeeds on sqlite3 and mysql2 (prove it with a direct
      `rawExecute` call in an adapter test, not only through `internalExecute`).
      PostgreSQL moved to `converge-pg-perform-query-onto-rails-arms` — see the
      2026-08-10 update below.
- [ ] parity:api / parity:test delta non-negative; all three lanes green.

## Update 2026-08-09 (PR #6313)

sqlite3 now carries a **`rawExecute` override** of its own
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`), added so
`execute_batch` could reach the batch arm the way Rails does. It is `log` around
`perform_query`'s three arms — batch / prepared / unprepared — but it **inlines
those arms** rather than dispatching to `performQuery`, precisely because
`_performQuery` still keeps the driver-shaped `(sql, driverBinds, payload)`
signature this story is about.

So when this story lands, that override must **collapse onto `performQuery`**,
not be left beside it as a parallel implementation of the same three arms.
`internalExecute` is already `preprocessQuery` → `rawExecute`, matching
`abstract/database_statements.rb:589-591` and `:552`, so the split above it is
in place and only the leaf dispatch is left.

## Update 2026-08-10 (PR #6327)

**The premise of the first acceptance criterion was wrong.** "as PostgreSQL
already does" — PG does not, and did not. `postgresql-adapter.ts` carries a
`private _performQuery(client, sql, binds, payload)` and no prototype
`performQuery`; the line the Context cites (`:5028`) is not an assignment. So
`rawExecute` reached the abstract `NotImplementedError` stub on **all three**
adapters, not two, and "all three lanes green" in the third criterion was
written believing PG needed nothing.

PR #6327 first renamed PG's method onto Rails' argument list, which is a
two-line change — and that alone made the body comparable to Rails for the first
time, surfacing four calls (`prepare_statement`, `is_cached_plan_failure?`, the
synchronized `@statements` delete, `handle_warnings`) that trails routes through
the invented `_runQuery` / `_flushWarnings` helpers. Baselining them was
rejected in review as ratified non-parity, correctly. The rename was therefore
reverted: PG's name and its body must converge together, which is a design task
(`_runQuery` also carries a `rowMode` option Rails has no analogue for, so
folding it into a Rails-signature `perform_query` is not mechanical), and that
is `converge-pg-perform-query-onto-rails-arms`.

What shipped: sqlite3 and mysql2 wired, `rawExecute` proven directly on both,
`postgresql-adapter.ts` untouched.
