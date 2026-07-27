---
title: "isNoDatabaseError predicate has no Rails counterpart (Rails raises NoDatabaseError inline at connect)"
status: ready
updated: 2026-07-27
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Real Rails deviation surfaced by `extra-surface-adapter-cross-file-recurring-names`
(PR 5345), currently carrying 3 allowlist entries in
`scripts/api-compare/extra-surface-allow.json`.

Rails has no `no_database_error?` predicate. It recognizes the no-such-database
condition inline at the connect site and raises `ActiveRecord::NoDatabaseError`
there:

- `vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:63`
  — `raise ActiveRecord::NoDatabaseError.db_error(conn_params[:dbname])`
- `vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:38`
  and `:120` — `raise ActiveRecord::NoDatabaseError` / `.new(connection_pool: @pool)`

trails instead has `isNoDatabaseError(error)` on `AbstractAdapter` (base returns
false) with driver-specific overrides on the PostgreSQL and SQLite3 adapters.
The reason it exists separately from raising: `_isMissingDatabaseError` in
`packages/activerecord/src/tasks/database-tasks.ts:1560` classifies an
**already-raised raw driver error**, after the adapter failed to construct — so
there is no adapter instance to have translated it.

That constraint is real, which is why this was allowlisted rather than deleted,
but it is worth checking whether it is still true. Investigate whether the
DatabaseTasks path can be restructured so the raise happens where Rails puts it
(at connect / `new_client`), leaving `translate_exception` and the error class as
the only surface — which would delete the predicate entirely.

Note the duck-typed call site guards with `typeof adapter?.isNoDatabaseError ===
"function"` and falls back to a hardcoded PG SQLSTATE `3D000` check, and that
several test doubles stub `isNoDatabaseError: () => false`
(`migration.test.ts`, `migrator.trails.test.ts`, `define-fixtures.test.ts`,
`fixtures.test.ts`, `use-fixtures.test.ts`) — those stubs are part of the
migration cost.

## Acceptance criteria

- A recorded decision: either the predicate is removed and the
  no-such-database condition is raised at the Rails site, or the story is closed
  with evidence that the DatabaseTasks classification path genuinely cannot be
  restructured, and the allowlist reasons are updated to cite that evidence.
- If removed: the 3 `isNoDatabaseError` allowlist entries are deleted, the
  test-double stubs are cleaned up, and the legacy hardcoded `3D000` fallback in
  `database-tasks.ts` goes with it.
- Adapter tests for each touched adapter pass (scoped `vitest run`, not the full
  suite). PostgreSQL and SQLite paths both exercised; MySQL unaffected but
  confirm it stays so.
