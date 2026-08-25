---
title: "executor-seam-end-to-end-request-coverage"
status: done
updated: 2026-08-15
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6551
claim: "2026-08-14T23:15:08Z"
assignee: "executor-seam-end-to-end-request-coverage"
blocked-by: null
closed-reason: null
---

## Context

PR #6532 ported the seam that runs `ActiveSupport::Executor` around a unit of
work: `Rails::Application#executor` (`vendor/rails/railties/lib/rails/application.rb:122-124`)
in `packages/trailties/src/application.ts`, and the `middleware.use
::ActionDispatch::Executor, app.executor` / `middleware.use
::ActionDispatch::Reloader, app.reloader` lines
(`vendor/rails/railties/lib/rails/application/default_middleware_stack.rb:49`, `:70`)
in `packages/trailties/src/application/default-middleware-stack.ts`.

Coverage stops at the wiring: `packages/trailties/src/application.test.ts`
asserts both middlewares are in the built stack and are handed `app.executor` /
`app.reloader`. What is not covered is the end-to-end claim — drive a request
through the assembled stack and confirm a body issuing `Model.all.loadAsync()`
finds an open `AsynchronousQueriesTracker` session (`core.rb:145-148`, ported at
`packages/activerecord/src/asynchronous-queries-tracker.ts`) with no hand-wired
`Executor.wrap`, and that the session is finalized when the request completes.

The test has to live in `trailties` (or a package that depends on both): it
needs `actionpack`'s middleware stack and `activerecord`'s trailtie hooks, and
`activerecord` does not depend on `actionpack`. That cross-package setup — a
Rack app plus an AR connection — is why it was left out of #6532 rather than
squeezed under its LOC ceiling.

## Acceptance criteria

1. A test builds the default middleware stack (or at minimum
   `ActionDispatch::Executor` around `app.executor`), with the
   `active_record.set_executor_hooks` initializer having run, and drives one
   request through it.
2. Inside that request a `loadAsync` / async `select` succeeds with no
   `Executor.wrap` / `runBang` in the test body — i.e. it does not raise
   `Can't perform asynchronous queries without a query session`.
3. The session is finalized when the request completes: the same query issued
   after the request raises again.
4. The query cache is likewise enabled for the request body and disabled +
   cleared afterwards, exercising `QueryCache.run` / `complete` through the real
   executor rather than a stub.
