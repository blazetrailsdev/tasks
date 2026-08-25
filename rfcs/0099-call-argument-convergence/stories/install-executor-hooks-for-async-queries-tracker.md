---
title: "install-executor-hooks-for-async-queries-tracker"
status: done
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6529
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #6515 ported `asynchronous_queries_tracker.rb` (story
`call-args-ar-select-all-empty-async-row`), landing `AsynchronousQueriesTracker`,
its nested `Session`, `run`, `complete`, `current_session`, `start_session` and
`finalize_session` at
`packages/activerecord/src/asynchronous-queries-tracker.ts`.

One member is not ported: `install_executor_hooks`
(`vendor/rails/activerecord/lib/active_record/asynchronous_queries_tracker.rb:32-34`),
which is `executor.register_hook(self)` against `ActiveSupport::Executor`.
`pnpm parity:api --package activerecord --missing` reports the file at 6/7 with
exactly this row.

It is unported because trails has no `ActiveSupport::Executor`: there is no
`packages/activesupport/src/executor.ts` (only `executor.test.ts`, which defines
a local stub class for its own use), and nothing exports `Executor` from
`packages/activesupport/src/index.ts`. There is therefore no `register_hook` to
call.

The consequence today is that nothing opens or closes an async-query session
around a unit of work. PR #6515 works around that at
`packages/activerecord/src/core.ts` (`asynchronousQueriesTracker`), whose
`IsolatedExecutionState.fetch` initializer calls `startSession()` on the newly
built tracker — Rails builds a bare tracker there (`core.rb:145-148`) and lets
the executor hook push the session. That deviation is what this story retires.

## Acceptance criteria

1. `ActiveSupport::Executor` is ported (`activesupport/lib/active_support/execution_wrapper.rb`
   / `executor.rb`) far enough to carry `register_hook`, `to_run`/`to_complete`,
   or the maintainer records that it stays unported and this row is registered
   as a permanent deviation.
2. `AsynchronousQueriesTracker.installExecutorHooks` is ported
   (`asynchronous_queries_tracker.rb:32-34`), so
   `pnpm parity:api --package activerecord --missing` reports
   `asynchronous_queries_tracker.rb` at 7/7.
3. `core.ts`'s `asynchronousQueriesTracker` initializer returns a bare
   `new AsynchronousQueriesTracker()` as Rails does (`core.rb:145-148`), with the
   session opened by the executor hook (`run`) instead.
4. The tests in `packages/activerecord/src/future-result.trails.test.ts` that
   cover session lifecycle still pass, and the async `select` path
   (`database-statements.ts`, the `scheduleBang(asynchronousQueriesSession())`
   arm) still finds a session.
