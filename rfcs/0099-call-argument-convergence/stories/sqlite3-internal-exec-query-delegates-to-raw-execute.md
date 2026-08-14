---
title: "SQLite3 internalExecQuery delegates to rawExecute + castResult, resolving the bigint-narrowing asymmetry"
status: done
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6544
claim: "2026-08-14T21:15:06Z"
assignee: "sqlite3-internal-exec-query-delegates-to-raw-execute"
blocked-by: null
closed-reason: null
---

## Context

Rails has no SQLite3 `internal_exec_query` override: `internal_exec_query` lives
on the abstract DatabaseStatements and is exactly

```ruby
def internal_exec_query(sql, name = "SQL", binds = [], prepare: false, async: false, allow_retry: false, &block)
  cast_result(raw_execute(sql, name, binds, prepare: prepare, async: async, allow_retry: allow_retry, &block))
end
```

(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:541-543`),
so on SQLite the whole read path funnels through the one `perform_query`
(`sqlite3/database_statements.rb:78-113`).

trails' `SQLite3Adapter#internalExecQuery`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:905-958`)
instead re-implements `perform_query` inline: it prepares the statement itself,
takes `acquireStatementLock` itself, and builds the `Result` itself — a second
copy of the branch `performQuery` already has
(`connection-adapters/sqlite3/database-statements.ts`, reader arm).

PR #6539 (story `sqlite3-perform-query-returns-result`) removed the reason that
duplication existed: `performQuery` now returns an `ActiveRecord::Result` built
from `stmt.columns()`, including the columns of a zero-row row-returning
statement, and `castResult` is the identity again. So `internalExecQuery` can
now be the one-line `castResult(rawExecute(...))` Rails has.

The duplication is also carrying a live behavioural asymmetry, surfaced in
review of #6539: `internalExecQuery` calls
`this._narrowSpilledBigInts(stmt, rows)` (`sqlite3-adapter.ts:939`, definition
at `:624-645`) before building the Result, and `performQuery` does not. So the
same SELECT returns narrowed integers through `execQuery`/`internalExecQuery`
and unnarrowed `bigint`s through `execute` / `rawExecute` / the `loadAsync`
`FutureResult` path, which reaches `raw_exec_query` =
`cast_result(raw_execute(...))`. That is pre-existing (it predates #6539 —
`performQuery` never narrowed) and was deliberately left out of that PR's scope.

## Acceptance criteria

1. `SQLite3Adapter#internalExecQuery` delegates to `rawExecute` + `castResult`
   as Rails' abstract `internal_exec_query` does
   (`abstract/database_statements.rb:541-543`), rather than re-preparing the
   statement, re-taking the statement lock, and rebuilding the Result.
2. The bigint-narrowing asymmetry is resolved rather than preserved: whatever
   narrowing survives applies identically to `execQuery`, `execute`,
   `rawExecute`, and the `loadAsync` path. If `_narrowSpilledBigInts` belongs
   at all it moves to the one `performQuery` reader arm; if it turns out to be
   a trails invention with no Rails counterpart (check
   `sqlite3_adapter.rb`'s type map and `stmt.setReadBigInts` handling before
   deciding), it goes.
3. A test covers the asymmetry directly — the same wide/narrow-column SELECT
   read through `execQuery` and through `execute` yields the same JS value
   types — and fails on the baseline.
4. `pnpm parity:api:calls` / `parity:api:calls:args` non-negative; converging
   `internal_exec_query` onto `cast_result`/`raw_execute` should retire, not
   add, baseline rows.
