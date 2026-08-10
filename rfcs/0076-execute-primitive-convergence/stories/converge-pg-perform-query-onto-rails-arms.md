---
title: "converge-pg-perform-query-onto-rails-arms"
status: claimed
updated: 2026-08-10
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-10T10:26:31Z"
assignee: "converge-pg-perform-query-onto-rails-arms"
blocked-by: null
closed-reason: null
---

## Context

`PostgreSQLAdapter#performQuery`
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`) was
renamed from the private `_performQuery` onto Rails' argument list in the
`wire-perform-query-on-sqlite3-mysql2-prototypes` PR. That rename made its body
comparable for the first time, and the call gate immediately surfaced four calls
Rails' `perform_query`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb:135-168`)
makes that the TS body does not:

- `prepare_statement` (`:139`)
- `is_cached_plan_failure?` (`:145`)
- `synchronize` (`:151`)
- `handle_warnings` (`:166`)

They are baselined in
`scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/postgresql-adapter.json`
with a "satisfied by a different path" reason: all four live inside the
trails-invented `_runQuery` helper (`postgresql-adapter.ts`, the
prepared-statement + invalid-cached-plan retry path) and `_flushWarnings`, which
Rails has no counterpart for — `perform_query` IS that code in Rails.

`handle_warnings` is worse than a "different path": `postgresql/database-statements.ts`
carries a **stub** port of it — `handleWarnings(result)`, wrong parameter (Rails'
takes `sql`, `postgresql/database_statements.rb:216`), a `TODO`, and no
`db_warnings_action` dispatch — assigned to the prototype beside the live
`_flushWarnings(sql)` on the adapter, which is the real port of that method
under a trails name. Converging it means deleting the stub and giving
`_flushWarnings` the Rails name and call site.

## Acceptance criteria

- [ ] `performQuery` inlines Rails' three arms (`prepare` → `prepare_statement` + `exec_prepared` with the `PG::FeatureNotSupported` rescue; empty binds →
      `async_exec`; otherwise `exec_params`) rather than delegating to
      `_runQuery`.
- [ ] `handle_warnings` is called from `performQuery` under its Rails name: the
      stub in `postgresql/database-statements.ts` is deleted and
      `_flushWarnings(sql)` takes its name, keeping the api:compare match on the
      `postgresql/database_statements.rb` file.
- [ ] `_runQuery` is removed, or reduced to whatever genuinely has no Rails
      counterpart, with its remaining callers converged.
- [ ] The four baseline rows above are deleted from
      `call-mismatches-exclude/.../postgresql-adapter.json` (the baseline is
      only-shrink).
- [ ] All three lanes green; api:compare / test:compare deltas non-negative.
