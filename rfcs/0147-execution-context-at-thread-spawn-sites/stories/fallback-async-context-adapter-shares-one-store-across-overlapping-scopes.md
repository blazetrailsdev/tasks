---
title: "Fallback AsyncContextAdapter shares one store across overlapping async scopes"
status: done
updated: 2026-09-11
rfc: "0147-execution-context-at-thread-spawn-sites"
cluster: null
packages: ["ruby-compat", "activesupport"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#7716
claim: "2026-09-11T19:06:58Z"
assignee: "fallback-async-context-adapter-shares-one-store-across-overlapping-scopes"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in the review of trails#7704. `createFallbackAdapter()`
(`packages/ruby-compat/src/async-context-adapter.ts:22-57`) is the
`AsyncContextAdapter` used when `node:async_hooks` is unavailable. It keeps a
single module-level `current` and restores it only when a scope's returned
promise settles. So any two overlapping async scopes read each other's store,
including awaited `withExecutionContext` bodies, `IsolatedExecutionState.scope`
flows and `ExecutionWrapper.wrap`.

In Rails, `IsolatedExecutionState` storage is per Thread/Fiber
(`activesupport/lib/active_support/isolated_execution_state.rb`), so concurrent
flows never share it. trails#7704 made the reaper hold a scope for a timer's
whole lifetime (`reaper.rb:41-63`, one thread per frequency). Under the
fallback, two reaper frequencies therefore report each other's context id.

Converged shape: the fallback propagates a store per async continuation, the
way ALS does. That means capturing the store at `setTimeout`/`setInterval`/
promise-continuation time, or using TC39 `AsyncContext` where it is available.
Where neither is possible, the adapter should refuse to run overlapping scopes
rather than silently share one.

## Acceptance criteria

- [ ] Two overlapping `IsolatedExecutionState.scope` async flows under the
      fallback adapter each see their own store.
- [ ] A timer created inside a scope sees that scope's store on every tick,
      even when another long-lived scope opened later.
