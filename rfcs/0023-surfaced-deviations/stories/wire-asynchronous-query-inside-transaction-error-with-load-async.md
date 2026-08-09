---
title: "wire-asynchronous-query-inside-transaction-error-with-load-async"
status: closed
updated: 2026-08-09
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
closed-reason: "Not actionable as filed: its own text establishes the guard would be dead code until FutureResult/async_enabled?/load_async are ported (a separate body of work), leaving only a stale comment citation. Unverifiable as a standalone convergence."
---

## Context

`wire-tablenotspecified-async-error-throw-sites` landed as #3562, but the
`AsynchronousQueryInsideTransactionError` throw site it named is still unwired.

Rails' `DatabaseStatements#select` raises that error when
`async && async_enabled? && current_transaction.joinable?`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb`,
`#select`). trails'
`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:2163-2171`
takes the `async` option in `_options` and then ignores it entirely, delegating
straight to `internalExecQuery`. The comment at :2153-2160 says the guard is
"tracked to land alongside the `load_async` port".

The deliberate reason still holds and is worth preserving: the guard would be
dead code today. `Relation#loadAsync` exists
(`packages/activerecord/src/relation.ts:2142-2164`) but it is a promise-stashing
shim, not Rails' `load_async` — there is no `FutureResult`, no
`async_enabled?`, and no async executor, so `async` never reaches `select` as
true and the guard could never fire. What is wrong is only the tracker: the
story cited has landed, so nothing owns the wiring any more.

## Acceptance criteria

- The `async_enabled?` / `FutureResult` infrastructure is ported far enough
  that `select`'s `async` argument is real.
- `select` raises `AsynchronousQueryInsideTransactionError` under Rails'
  exact condition (`async && async_enabled? && current_transaction.joinable?`),
  with Rails' message.
- The stale `wire-tablenotspecified-async-error-throw-sites` citation at
  database-statements.ts:2160 is removed.
- If the `load_async` port is still out of reach, repoint the comment at the
  story that owns it rather than at a landed one.
