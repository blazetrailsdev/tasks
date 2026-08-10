---
title: "converge-pg-perform-query-onto-rails-arms"
status: done
updated: 2026-08-10
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6330
claim: "2026-08-10T10:26:31Z"
assignee: "converge-pg-perform-query-onto-rails-arms"
blocked-by: null
closed-reason: null
---

## Context

`PostgreSQLAdapter` still carries a private `_performQuery(client, sql, binds,
payload)` on a trails argument list
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`), so
`rawExecute` reaches the abstract `NotImplementedError` stub on PG while
sqlite3 and mysql2 answer it (PR #6327).

Renaming it onto Rails' argument list is a two-line change, and #6327 did
exactly that — then reverted it. The rename makes the body comparable for the
first time, and the call gate immediately surfaces four calls Rails'
`perform_query`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb:135-168`)
makes that the TS body does not:

- `prepare_statement` (`:139`)
- `is_cached_plan_failure?` (`:145`)
- `synchronize` (`:151`)
- `handle_warnings` (`:166`)

All four live inside the trails-invented `_runQuery` helper
(`postgresql-adapter.ts`, the prepared-statement + invalid-cached-plan retry
path) and `_flushWarnings` — code that Rails has no counterpart for, because in
Rails `perform_query` IS that code. Baselining them was rejected in review as
ratified non-parity, correctly: the rename must land together with the body
convergence, not ahead of it. So this story owns both.

`handle_warnings` is worse than a "different path": `postgresql/database-statements.ts`
carries a **stub** port of it — `handleWarnings(result)`, wrong parameter (Rails'
takes `sql`, `postgresql/database_statements.rb:216`), a `TODO`, and no
`db_warnings_action` dispatch — assigned to the prototype beside the live
`_flushWarnings(sql)` on the adapter, which is the real port of that method
under a trails name. Converging it means deleting the stub and giving
`_flushWarnings` the Rails name and call site.

## Acceptance criteria

- [ ] `_performQuery` is renamed to `performQuery` on Rails' argument list
      (`raw_connection, sql, binds, type_casted_binds, prepare:,
notification_payload:, batch:`) and assigned to the prototype, so
      `rawExecute` works on PG as it now does on sqlite3 and mysql2.
- [ ] `performQuery` inlines Rails' three arms (`prepare` → `prepare_statement` + `exec_prepared` with the `PG::FeatureNotSupported` rescue; empty binds →
      `async_exec`; otherwise `exec_params`) rather than delegating to
      `_runQuery`.
- [ ] `handle_warnings` is called from `performQuery` under its Rails name: the
      stub in `postgresql/database-statements.ts` is deleted and
      `_flushWarnings(sql)` takes its name, keeping the parity:api match on the
      `postgresql/database_statements.rb` file.
- [ ] `_runQuery` is removed, or reduced to whatever genuinely has no Rails
      counterpart, with its remaining callers converged.
- [ ] No baseline rows are added for the four calls above — the convergence is
      what makes them pass.
- [ ] `packages/activerecord/src/database-statements-raw-execute.trails.test.ts`
      drops its `currentAdapter("SQLite3Adapter", "Mysql2Adapter")` gate so the
      PG lane exercises `rawExecute` too.
- [ ] All three lanes green; parity:api / parity:test deltas non-negative.
