---
title: "SQLite3 performQuery returns an ActiveRecord::Result, restoring the identity castResult"
status: done
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6539
claim: "2026-08-14T19:15:06Z"
assignee: "sqlite3-perform-query-returns-result"
blocked-by: null
closed-reason: null
---

## Context

Rails' SQLite3 `perform_query` returns an `ActiveRecord::Result`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:78-113`),
which is precisely why its `cast_result` is the identity (`:117-121`):

```ruby
result = ActiveRecord::Result.new(stmt.columns, stmt.to_a)
...
def cast_result(result) = result
```

trails' `performQuery`
(`packages/activerecord/src/connection-adapters/sqlite3/database-statements.ts:256-329`)
returns the raw bag `{ rows, affectedRows, insertRowid }` instead — the last two
are read off the RETURN value by `executeMutation` to avoid racing
`this._lastAffectedRows` / `this._lastInsertRowid`.

The divergence surfaced through `FutureResult`: `raw_exec_query` is
`cast_result(raw_execute(...))` (`abstract/database_statements.rb:541-543`), so
on SQLite the async `load_async` path received the raw bag instead of a Result
and blew up with `result.toArray is not a function`. PR for story
`wire-load-async-through-future-result` unblocked it by teaching
`castResult` to build the Result from a bag when it isn't handed one — a
documented deviation, not a convergence.

Two consequences remain:

- `castResult` is no longer the identity Rails' is.
- The bag carries no column set, so `Result.fromRowHashes(rows)` loses the
  columns of a zero-row SELECT, where Rails keeps `stmt.columns`.

## Acceptance criteria

1. `performQuery` returns what Rails' `perform_query` returns — an
   `ActiveRecord::Result` built from the statement's columns and rows,
   including the columns of a zero-row row-returning statement.
2. `executeMutation` and the other `performQuery` call sites
   (`sqlite3-adapter.ts:524,685,862`) get their `affectedRows` / `insertRowid`
   without re-reading the shared `this._last*` fields across an await — e.g. by
   the same non-racing means Rails uses.
3. `castResult` in `sqlite3/database-statements.ts` is the identity again, with
   Rails' comment, and the deviation note added by
   `wire-load-async-through-future-result` is deleted.
4. `Model.all.loadAsync()` against the canonical schema still round-trips on the
   SQLite lane (`packages/activerecord/src/relation-load-async.trails.test.ts`).
