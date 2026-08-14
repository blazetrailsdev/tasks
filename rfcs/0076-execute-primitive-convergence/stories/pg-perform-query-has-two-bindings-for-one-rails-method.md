---
title: "PG carries two bindings for one Rails perform_query; collapse onto the Rails name"
status: draft
updated: 2026-08-14
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
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

Rails has ONE `perform_query` on the PostgreSQL adapter
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb:135-168`).
trails carries two bindings for it after PR #6530:

- `private _performQuery = pgPerformQuery` (`postgresql-adapter.ts`), which
  every in-file caller uses, and
- `PostgreSQLAdapter.prototype.performQuery = function (...)` at the bottom of
  the same file — a wrapper that supplies `rowMode: "array"` so
  `raw_execute` → `raw_exec_query` → `cast_result` gets positional rows. That is
  the path `FutureResult#exec_query` runs on (future_result.rb:169-171), so
  without it `load_async` raised `perform_query is not implemented` on the PG
  lane.

The wrapper exists only because `rowMode` cannot be defaulted: a `PG::Result`
gives Rails both row views off one result (`cast_result` reads `result.values`,
`postgresql/database_statements.rb:180`), while node-pg decodes into one shape
before the query runs. Three call sites read hash rows and pass no `rowMode`
(`postgresql-adapter.ts` — the `execute` rows return, the RETURNING read, and
the `result.rows[0][Object.keys(result.rows[0])[0]]` insert-id read), so
flipping the default to `"array"` would silently change those write paths.

## Acceptance criteria

- One binding under Rails' name: `_performQuery` is gone and every caller goes
  through `performQuery`, matching how `SQLite3Adapter` and `Mysql2Adapter`
  bind theirs (`sqlite3-adapter.ts:553,3265`; `mysql2-adapter.ts:904,2067`).
- The hash-row callers state the shape they read explicitly (or are converged
  to read positionally), so `rowMode` has one meaning at every call site and
  the `raw_execute` seam needs no wrapper.
- The `rowMode` deviation keeps its `@noRailsEquivalent`-grade justification in
  ONE place — the extracted `performQuery` in
  `postgresql/database-statements.ts` — not restated at a second binding.
- `pnpm parity:api:calls` stays green with no new baseline rows: the point of
  the single binding is that only the extracted body scores against Rails'
  `perform_query`.
- All three lanes green; `database-statements-raw-execute.trails.test.ts` keeps
  running on PG (its adapter gate came off in #6530).
