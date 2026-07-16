---
title: "Converge sqlite _performQuery contract (DDL affected_rows + RETURNING return) via connection lock"
status: ready
updated: 2026-07-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AbstractSQLite3Adapter._performQuery` (added by the merged
`unify-execute-mutation-into-perform-query`, PR 4893) is Rails' single
`perform_query` primitive
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:78-123`),
but carries two documented deviations. Both stem from ONE root cause: trails'
sqlite adapter runs statements WITHOUT holding a connection lock across awaits
(execute/executeMutation call the driver directly, not through
`withRawConnection`/`@lock`), so it cannot atomically read connection-level state
(`raw_connection.changes` / prepared-statement `column_count`) the way Rails'
synchronous, lock-held `perform_query` does.

1. **DDL `affected_rows` is 0, not preserved.** Rails sets
   `@last_affected_rows = raw_connection.changes` (= `sqlite3_changes()`) after
   every statement; that counter is advanced only by DML and PRESERVED across
   DDL/COMMIT. trails sources the count from the `.run()` RunResult
   (`result.changes`), which is 0 for DDL — so after `UPDATE`(2) then
   `CREATE TABLE`, Rails reports `affected_rows` 2 and trails reports 0. Sourcing
   `sqlite3_changes()` atomically would need a lock (a separate awaited
   `SELECT changes()` RACES under concurrent writes — see PR 4893 history).

2. **`INSERT ... RETURNING` returns no rows from the primitive.** Rails branches
   on `stmt.column_count.zero?`, so a RETURNING write has nonzero column count and
   comes back as `Result.new(columns, to_a)` with `row_count = 1`. trails branches
   on `stmt.reader && !isWrite`, so every write (incl. RETURNING) takes `.run()`
   and returns `[]` (`row_count = 0`) — done deliberately so the id/count come
   from the RunResult atomically instead of a racy readback. Masked today: the
   multi-column RETURNING read-back goes through `internalExecQuery` (`.all()`)
   and single-column through `executeMutation`'s rowid, so nothing calls
   `execute()`/`_performQuery` expecting RETURNING rows — but the primitive's
   contract has diverged from the method it claims to mirror.

Both are bounded and accepted for now (no caller reads `affected_rows` after a
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
- [ ] `INSERT ... RETURNING` through the primitive returns its rows with
      `row_count = 1`, matching Rails' `column_count.zero?` branch, while keeping
      the atomic id/count source (no racy readback) and the concurrent-insert
      guarantee (has-many-through "should respect table alias" stays green).
- [ ] Narrow or remove the deviation notes in `_performQuery`'s docstring once
      the contract matches.

## Notes

Sequences after the per-adapter unification
(`unify-execute-mutation-into-perform-query-postgresql`,
`unify-execute-mutation-into-perform-query-mysql2`) if the lock discipline is
shared across adapters. Hard rules: no `node:*` imports. No `process.*`. Async fs
only. No new third-party runtime deps. 500 LOC ceiling. Single PR from main. Test
names match Rails verbatim.
