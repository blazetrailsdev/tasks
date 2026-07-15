---
title: "unify-execute-mutation-into-perform-query-postgresql"
status: ready
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
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

Second of the per-adapter split of `unify-execute-mutation-into-perform-query`
(sqlite3 landed in PR 4893). Rails has ONE SQL primitive per adapter,
`perform_query`, which branches internally on whether the statement returns
rows; trails splits it into `execute` (rows) and `executeMutation`
(affected-rows / insert id). The split is the deviation, and it blocks routing
DDL through the public `execute` the way Rails' `schema_statements.rb` does.

Rails' PG primitive:
`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb:135`.

trails' PG pair:

- `postgresql-adapter.ts:1704` — `execute`, runs `_runQuery` and returns
  `result.rows`.
- `postgresql-adapter.ts:1769` — `executeMutation`.

PG is the hard one of the three. Its `executeMutation` carries machinery its
`execute` does not, all of which has to survive the fold:

- auto-appends `RETURNING id` for a bare INSERT when `_useInsertReturning`
  (mirrors postgresql*adapter.rb:630), wrapping the attempt in a SAVEPOINT
  (`\_bt_ret*<n>`) when in a transaction and re-running without RETURNING on
  failure.
- rewrites `payload.sql` to the statement actually sent.

Unlike sqlite, node-pg does not throw on a non-row-returning statement — it
returns a Result with `rows: []` and a `rowCount` — so the branch is about
sourcing affected rows, not about avoiding a driver throw.

Note `withRawConnection` already mirrors Rails' `dirty_current_transaction` in
its ensure (`abstract-adapter.ts:2187`), and PG routes through it, so PG does
not need the dirty handling sqlite3 needed.

## Acceptance criteria

- [ ] Give the PG adapter a single Rails-shaped `performQuery` that both
      `execute` and `executeMutation` delegate to, mirroring `perform_query` in
      `postgresql/database_statements.rb`.
- [ ] Source affected rows from a separate `affectedRows` read, backed by a
      last-affected-rows field, rather than from the statement result —
      mirroring Rails' `affected_rows`. A port already exists in
      `postgresql/database-statements.ts` — wire that one rather than adding a
      second copy (see PR 4893, which did this for sqlite3's `affected_rows`).
- [ ] Preserve the RETURNING-append + SAVEPOINT fallback and the `payload.sql`
      rewrite exactly; they are load-bearing for `execInsert`.
- [ ] Preserve the readonly-write guard and `materializeTransactions()`.
- [ ] Do NOT reroute the DDL call sites — that is
      `converge-ddl-through-execute-drop-dirty-guard`, which needs all three
      adapters branching first.
- [ ] PG adapter tests green (`ARCONN=postgresql`).

## Notes

Hard rules: no `node:*` imports. No `process.*` references. Async fs only.
No new third-party runtime deps. 500 LOC ceiling. NO STACKED PRs — single PR
from main. Test names match Rails verbatim.
