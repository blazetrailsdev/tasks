---
title: "unify-execute-mutation-into-perform-query-mysql2"
status: ready
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps:
  - unify-execute-mutation-into-perform-query-postgresql
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

Third of the per-adapter split of `unify-execute-mutation-into-perform-query`
(sqlite3 landed in PR 4893; postgresql is
`unify-execute-mutation-into-perform-query-postgresql`). Rails has ONE SQL
primitive per adapter, `perform_query`, branching internally on whether the
statement returns rows; trails splits it into `execute` (rows) and
`executeMutation` (affected-rows / insert id). That split is the deviation and
it blocks routing DDL through the public `execute`.

Rails' MySQL primitive:
`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql2/database_statements.rb:41`.

trails' MySQL pair:

- `mysql2-adapter.ts:915` — `execute`
- `mysql2-adapter.ts:986` — `executeMutation`

MySQL specifics to preserve:

- MySQL 8 has no `INSERT ... RETURNING`, so `execInsertReturningReadback`
  returns undefined and `execInsert` keeps the `executeMutation` fast path
  (`supportsInsertReturning?()` is the gate) — the insert id comes from the
  driver's `insertId`.
- `mysql2-adapter.ts:1352` has a DDL `executeMutation` override to fold in.
- mysql2 returns a ResultSetHeader (with `affectedRows` / `insertId`) rather
  than rows for a non-row-returning statement, so the branch is about which
  shape came back, not about a driver throw.

`withRawConnection` already mirrors Rails' `dirty_current_transaction` ensure
(`abstract-adapter.ts:2187`), so MySQL should not need the dirty handling
sqlite3 needed — verify rather than assume.

## Acceptance criteria

- [ ] Give the MySQL adapter a single Rails-shaped `performQuery` that both
      `execute` and `executeMutation` delegate to, mirroring `perform_query` in
      `mysql2/database_statements.rb`.
- [ ] Source affected rows from a separate `affectedRows` read, backed by a
      last-affected-rows field, rather than from the statement result —
      mirroring Rails' `affected_rows`. Wire any existing port in
      `mysql2/database-statements.ts` rather than adding a second copy (see PR
      4893, which did this for sqlite3).
- [ ] Preserve the readonly-write guard and `materializeTransactions()`.
- [ ] Do NOT reroute the DDL call sites — that is
      `converge-ddl-through-execute-drop-dirty-guard`, which needs all three
      adapters branching first.
- [ ] MySQL adapter tests green (`ARCONN=mysql2`), including MariaDB.

## Notes

Hard rules: no `node:*` imports. No `process.*` references. Async fs only.
No new third-party runtime deps. 500 LOC ceiling. NO STACKED PRs — single PR
from main. Test names match Rails verbatim.
