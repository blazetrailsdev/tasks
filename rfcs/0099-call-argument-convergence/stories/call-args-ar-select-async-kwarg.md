---
title: "call-args-ar-select-async-kwarg"
status: blocked
updated: 2026-08-13
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-13T18:25:39Z"
assignee: "call-args-ar-select-async-kwarg"
blocked-by: "Blocked on a project-level unported decision, not on effort. All four rows require Rails' thread-backed async query stack: select(..., async:) at vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:671-699 needs async_enabled? (abstract_adapter.rb:562 -> pool.async_executor), FutureResult#schedule!/execute! (future_result.rb:82-88) against ActiveRecord::Base.asynchronous_queries_session, and Result.empty(async: true) -> EMPTY_ASYNC = FutureResult.wrap(EMPTY) (result.rb:247). Those three files are permanently excluded in scripts/parity/unported-files/unscoped.ts (promise.rb:16-20, future_result.rb:21-29, asynchronous_queries_tracker.rb:30-35) with the reviewed reason that Ruby's Mutex/thread-pool/Concurrent primitives have no single-threaded-JS equivalent and collapse into the native Promise every trails adapter method already returns. So acceptance criteria 1 and 3 (port FutureResult + load_async infra; wire AsynchronousQueryInsideTransactionError) contradict that decision, and criteria 2/4 cannot be met honestly without them - plumbing an inert async kwarg would fake a feature we do not have, which is exactly what the note at packages/activerecord/src/connection-adapters/abstract/database-statements.ts:2099-2112 records. Needs a maintainer call: either reverse the unported-files entries (a large, separate campaign) or retire these four rows as a permanent language-shortcoming deviation."
closed-reason: null
---

## Context

Split out of `call-args-ar-dropped-argument` (RFC 0099). Four RFC 0095
call-argument rows on `connection-adapters/abstract-adapter.ts` all drop the
same kwarg — Rails' `async:` on the select family
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:69-102`):

- `select_all` → `Result.empty(async: async)` (:79)
- `select_one` → `select_all(arel, name, binds, async: async)` (:85)
- `select_value` → `select_rows(arel, name, binds, async: async)` (:90)
- `select_rows` → `select_all(arel, name, binds, async: async)` (:102)

They cannot converge until `load_async` lands: `select_all` turns the kwarg
into `FutureResult::SelectAll` (:75), and `Result.empty(async: true)` returns
`EMPTY_ASYNC = FutureResult.wrap(EMPTY)` (`result.rb:247`). trails deliberately
does not port FutureResult / `async_enabled?` / the async executor — see the
note at
`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:2099-2112`,
which also defers the `AsynchronousQueryInsideTransactionError` guard for the
same reason.

## Acceptance criteria

1. Port `FutureResult` and the `load_async` infrastructure the four call sites
   need (or land this alongside the story that does).
2. `selectAll` / `selectOne` / `selectValue` / `selectRows` take Rails'
   `async:` kwarg with Rails' default and forward it exactly as Rails does,
   including `Result.empty({ async })`.
3. The `AsynchronousQueryInsideTransactionError` guard deferred at
   `database-statements.ts:2099-2112` is wired.
4. The four `connection-adapters/abstract-adapter.ts` `kind: "args"` baseline
   rows are deleted (only-shrink; no `--write`).
