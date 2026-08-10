---
title: "Converge sqlite _performQuery contract (DDL affected_rows + RETURNING return) via connection lock"
status: done
updated: 2026-08-10
rfc: "0076-execute-primitive-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 240
priority: null
pr: 6299
claim: "2026-08-09T20:39:15Z"
assignee: "datetime-proleptic-arm-computes-its-jd-eagerly"
blocked-by: null
closed-reason: null
---

## Context

Merged 2026-08-09 with `sqlite-perform-query-iswrite-gate-drops-returning-rows`,
which was a strict subset of deviation 2 below — one claim, one PR.

`AbstractSQLite3Adapter._performQuery` (added by the merged
`unify-execute-mutation-into-perform-query`, PR 4893) is Rails' single
`perform_query` primitive
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:78-123`),
but carries two deviations. Both stem from ONE root cause: trails'
sqlite adapter runs statements WITHOUT holding a connection lock across awaits
(execute/executeMutation call the driver directly, not through
`withRawConnection`/`@lock`), so it cannot atomically read connection-level state
(`raw_connection.changes` / prepared-statement `column_count`) the way Rails'
synchronous, lock-held `perform_query` does.

Verified still live on origin/main 2026-08-09: the body is
`packages/activerecord/src/connection-adapters/sqlite3/database-statements.ts`
(wired as `_performQuery` in `sqlite3-adapter.ts`, backing both `execute` and
`executeMutation`), and the gate is still
`if (stmt.reader && !isWrite)` at `sqlite3/database-statements.ts:212`, with
`isWriteQuery` at `:42` and the explanatory comment at `:209-211`.

1. **DDL `affected_rows` is 0, not preserved.** Rails sets
   `@last_affected_rows = raw_connection.changes` (= `sqlite3_changes()`) after
   every statement; that counter is advanced only by DML and PRESERVED across
   DDL/COMMIT. trails sources the count from the `.run()` RunResult
   (`result.changes`), which is 0 for DDL — so after `UPDATE`(2) then
   `CREATE TABLE`, Rails reports `affected_rows` 2 and trails reports 0. Sourcing
   `sqlite3_changes()` atomically would need a lock (a separate awaited
   `SELECT changes()` RACES under concurrent writes — see PR 4893 history).

2. **`INSERT ... RETURNING` returns no rows from the primitive.** Rails branches
   on `stmt.column_count.zero?` ALONE — there is no write predicate in the
   branch. The `!isWrite` conjunct is a trails invention, so a RETURNING write
   always takes the `.run()` branch and `execute()` returns `[]`
   (`row_count = 0`) where Rails returns `Result.new(columns, to_a)` with
   `row_count = 1`. Verified on every driver: an adapter-level
   `execute("INSERT ... RETURNING id, name")` returns `[]` on better-sqlite3,
   libsql and node-sqlite alike.

   Masked today: the multi-column RETURNING read-back goes through
   `internalExecQuery` (`.all()`, no isWrite gate) and single-column through
   `executeMutation`'s rowid, so nothing calls `execute()`/`_performQuery`
   expecting RETURNING rows — but the primitive's contract has diverged from the
   method it claims to mirror. PR #4979 fixed the adjacent driver-level half
   (`SqliteStatement#reader` was regex-derived on node-sqlite/expo and
   misclassified RETURNING); only the `_performQuery` gate remains.

### Why removing `!isWrite` is not a one-line change

The gate exists so writes take `.run()`, whose `RunResult` supplies `changes` /
`lastInsertRowid` ATOMICALLY — PR #4893 introduced this specifically because a
separate awaited `SELECT last_insert_rowid()` races under `Promise.all` (see the
comment block in `performQuery`). `executeMutation` returns
`Number(insertRowid)` for a single-column `INSERT ... RETURNING id`, so routing
that to `.all()` loses the rowid and would regress #4893. Rails does not have
this problem: it reads `raw_connection.changes` post-hoc and is single-threaded
per connection. Hence the connection-lock discipline in the criteria below —
it is the shared fix for both deviations.

Both are bounded and accepted today (no caller reads `affected_rows` after a
DDL; nothing reads RETURNING rows off this path), but "always converge, never
ratify": tracked here rather than left as a ratified deviation.

## Acceptance criteria

- [ ] Give `_performQuery` a connection-lock discipline (Rails' `@lock` /
      `with_raw_connection`) so it can read connection-level `sqlite3_changes()`
      atomically with the write, without the concurrent-write race that forced
      sourcing from the per-statement RunResult.
- [ ] DDL `affected_rows` preserves the prior DML's count, matching Rails
      (`UPDATE`(2) then `CREATE TABLE` reports 2). Restore the dropped assertion
      in `sqlite3-adapter-perform-query.trails.test.ts`.
- [ ] `_performQuery` branches on the statement's column count alone, matching
      Rails' `column_count.zero?`, so `execute("INSERT ... RETURNING ...")`
      yields the returned rows with `row_count = 1` on better-sqlite3, libsql and
      node-sqlite.
- [ ] `executeMutation`'s affected-rows and insert-rowid return values stay
      correct AND race-free for RETURNING writes — do not reintroduce a separate
      awaited `last_insert_rowid()` readback. Likely needs a connection-level
      `changes` / `lastInsertRowid` accessor on `SqliteConnection`
      (`sqlite-adapter.ts`), which currently exposes neither.
- [ ] Re-enable the adapter-level `execute` assertion removed from
      `packages/activerecord/src/sqlite/statement-reader.test.ts` by #4979
      (see the comment above the `describe.each(adapters)` block, which names the
      now-merged `sqlite-perform-query-iswrite-gate-drops-returning-rows`),
      parameterized across drivers.
- [ ] Concurrency coverage: parallel `Promise.all` inserts still return
      distinct, correct ids, and the has-many-through "should respect table
      alias" guarantee stays green.
- [ ] Narrow or remove the deviation notes in `_performQuery`'s docstring once
      the contract matches.

## Notes

Sequences after the per-adapter unification
(`unify-execute-mutation-into-perform-query-postgresql`,
`unify-execute-mutation-into-perform-query-mysql2`) if the lock discipline is
shared across adapters. Hard rules: no `node:*` imports. No `process.*`. Async fs
only. No new third-party runtime deps. Respect the LOC ceiling. Single PR from main. Test
names match Rails verbatim.
