---
title: "sqlite-regex-driver-reader-misses-returning"
status: claimed
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-20T00:21:11Z"
assignee: "sqlite-regex-driver-reader-misses-returning"
blocked-by: null
closed-reason: null
---

## Context

The regex SQLite drivers misclassify `INSERT ... RETURNING` as non-row-returning,
so it takes the `.run()` branch and its RETURNING rows are dropped.

`SqliteStatement.reader` is the signal both `internalExecQuery`
(`sqlite3-adapter.ts` ~line 872, on main) and the newer unified `_performQuery`
(added by PR 4893) branch on to choose `.all()` (rows) vs `.run()` (no rows) —
mirroring Rails' `stmt.column_count.zero?`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:84`).

- `better-sqlite3.ts` delegates `reader` to the driver's real column count, so
  `INSERT ... RETURNING` correctly reports `reader = true`.
- `node-sqlite.ts` (~line 45) and `expo-sqlite.ts` (~line 71) compute `reader`
  from a regex: `/^(SELECT|WITH|EXPLAIN|VALUES|TABLE)\b/` (+ read PRAGMA). An
  `INSERT ... RETURNING` matches none, so `reader = false` there.

Consequence on the regex drivers: a row-returning write takes the `.run()`
branch, so `execute("INSERT … RETURNING …")` / the non-reader `internalExecQuery`
path returns an empty Result instead of the RETURNING rows — node-sqlite's
`StatementSync#all()` would have returned them without throwing. Rails branches
on the prepared statement's actual `column_count`, which is nonzero for
RETURNING, so it always reads them back. CI runs better-sqlite3 only, so this is
invisible in the current matrix.

Note: PR 4893 made `executeMutation`'s id-return correct on ALL drivers for
`INSERT ... RETURNING` (the id now comes from the post-write
`last_insert_rowid()` readback, not the RETURNING row), so the remaining gap is
specifically the ROW-returning path (`execute` / multi-column
`internalExecQuery`) on the regex drivers.

## Acceptance criteria

- [ ] Make `reader` on the regex drivers reflect the prepared statement's real
      column count (Rails `column_count`), OR route the `.all()`/`.run()`
      decision off something other than the leading-keyword regex, so
      `INSERT ... RETURNING` takes the row-returning branch on node-sqlite and
      expo (verify libsql too).
- [ ] Both `internalExecQuery` and `_performQuery` return the RETURNING rows on
      every driver, matching Rails' `column_count`-based branch.
- [ ] Add a driver-parameterized test (not better-sqlite3-only) asserting
      `execute("INSERT ... RETURNING ...")` yields the returned rows.

## Notes

Pre-existing: the `stmt.reader` branch in `internalExecQuery` predates PR 4893;
4893 extended the same pattern to `execute`/`executeMutation`. Fix belongs at the
driver `reader`, not at either call site.

Hard rules: no `node:*` imports outside the node-sqlite driver shim. No
`process.*` references. Async fs only. No new third-party runtime deps. 500 LOC
ceiling. NO STACKED PRs — single PR from main. Test names match Rails verbatim.
