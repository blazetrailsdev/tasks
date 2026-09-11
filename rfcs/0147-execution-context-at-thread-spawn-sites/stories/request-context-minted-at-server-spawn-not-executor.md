---
title: "Mint the request execution context at the Rack server spawn site, not in ActionDispatch::Executor"
status: draft
updated: 2026-09-11
rfc: "0147-execution-context-at-thread-spawn-sites"
cluster: null
packages: []
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

trails#7713 made `ActionDispatch::Executor#call`
(`packages/actionpack/src/action-dispatch/middleware/executor.ts`) wrap each
request in `IsolatedExecutionState.run`, minting the request's execution
context there. Rails does not mint anything in
`actionpack/lib/action_dispatch/middleware/executor.rb:13-34`. The request's
Thread/Fiber comes from the Rack server's worker spawn, and
`IsolatedExecutionState.context` (`activesupport/lib/active_support/isolated_execution_state.rb:52-54`)
is simply `Thread.current`. The server also closes the body on that same thread,
so `state.complete!` runs in the request's state.

Because the minting sits at the Executor, trails needs two deviations:

- The `BodyProxy` close callback re-scopes to the captured request context with
  `IsolatedExecutionState.scope(Symbol.for("ar_execution_context_id"), context, ...)`.
  That is a third spelling of the key, and it forks the _caller's_ store rather
  than re-entering the request's.
- Callers of `Executor#call` no longer share the request's state after `call()`
  returns. `packages/trailties/src/application/executor-seam.trails.test.ts`
  was changed to observe the session through a captured object.

## Converged shape

- Mint the context at the Rack server's per-request spawn site (the trails
  server/handler that invokes the app), the analogue of Puma's worker thread.
- `Executor#call` returns to Rails' body line for line, with no
  `IsolatedExecutionState.run` and no re-scope in the `BodyProxy` block.
- Body close runs inside that server-side scope, so `complete!` sees the
  request's state, as in Rails.

## Acceptance criteria

- [ ] `executor.ts` has no `IsolatedExecutionState` reference, and its body mirrors `executor.rb:13-34`.
- [ ] Two concurrent requests through the server get distinct `Lease`s (`connection_pool.rb:710-711`).
- [ ] The body-close `completeBang` runs in the request's own state.
- [ ] The `executor-seam.trails.test.ts` caller-side assertion is restored if the harness drives requests through the server spawn site.
