---
title: "port-executor-wrapping-around-a-unit-of-work"
status: done
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6532
claim: "2026-08-14T17:22:10Z"
assignee: "converge-isolated-execution-state-delete-returns-value"
blocked-by: null
closed-reason: null
---

## Context

PR #6529 ported `ActiveSupport::ExecutionWrapper` / `ActiveSupport::Executor`
and the `active_record.set_executor_hooks` initializer
(`vendor/rails/activerecord/lib/active_record/railtie.rb:288-292`), so
`AsynchronousQueriesTracker`, `QueryCache` and `ConnectionPool` all register
their run/complete hooks at boot.

What is still missing is the other half of Rails' lifecycle: something that
actually _runs_ the executor around a unit of work. In Rails that is
`ActionDispatch::Executor` (actionpack) around each request, `ActiveJob`'s
executor wrapping around each job, and `ActiveSupport::Executor.wrap` /
`run!`/`complete!` around console and runner. trails has no such layer: grep for
`Executor.wrap` / `runBang` outside tests returns nothing.

The visible consequence is on the async-query path. Rails' bare tracker
(`core.rb:145-148`) raises `Can't perform asynchronous queries without a query
session` from `current_session` unless an execution opened one — trails now
matches that exactly, which means `load_async` / the async `select` arm
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:2200`)
only works inside an explicit `Executor.wrap` / `run!`. Standalone Rails
(ActiveRecord without an app booting the middleware) behaves the same way, so
this is fidelity rather than a port bug — but trails has no framework layer that
supplies the wrap yet, so in practice every trails consumer has to hand-wrap.

## Acceptance criteria

1. Identify and port the Rails seam that wraps a unit of work in
   `ActiveSupport::Executor` — at minimum whichever of
   `ActionDispatch::Executor` (actionpack) or the ActiveJob executor wrapping is
   in trails' porting closure, cited by `gem/path.rb:LINE`.
2. Async queries work end to end without a hand-wired `Executor.wrap` in the
   consumer: a query issued inside the ported seam finds a session, and the
   session is finalized when the unit of work completes.
3. If the seam is genuinely out of trails' closure today, `pnpm tasks block`
   this story with the specific unported framework and leave the hand-wrap as
   the documented entry point — do not reintroduce `core.rb`'s tracker
   initializer priming a session, which is the deviation #6529 retired.
