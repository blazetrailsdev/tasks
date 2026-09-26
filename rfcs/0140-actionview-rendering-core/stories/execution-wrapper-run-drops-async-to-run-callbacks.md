---
title: "ExecutionWrapper#run drops async to_run callbacks, so ViewReloader#execute is never awaited"
status: draft
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionView::Railtie`'s `after_initialize` (`vendor/rails/v8.0.2/actionview/lib/action_view/railtie.rb:113-121`) registers
`app.reloader.to_run { require_unload_lock!; view_reloader.execute }`. Ported in
trails#8159 at `packages/trailties/src/trailties/action-view.ts`, where the
callback returns `viewReloader.execute()`. That value is a Promise, because
`FileUpdateChecker#execute` (`packages/activesupport/src/file-update-checker.ts`) is `async`.

`ExecutionWrapper#run` (`packages/activesupport/src/execution-wrapper.ts`, the
port of `execution_wrapper.rb:127-129`, `run_callbacks(:run)`) is typed `void`
and drops whatever `runCallbacks(this, "run")` returns. `runCallbacks` returns a
promise when a callback returns a thenable (`callbacks.ts`, `suspend`), so
`run!` / `wrap` / `Reloader.run!` never await an async `to_run` callback. In Ruby
the callback completes before `run!` returns. Here, `reload!` →
`DetailsKey.clear` can land after the request it was meant to precede has
already rendered with stale template caches.

## Converged shape

`ExecutionWrapper#run` / `#run!` (and `complete` / `complete!`, same shape at
`execution_wrapper.rb:141-143`) propagate the `runCallbacks` result, and every
caller that hands them an async callback awaits it (`ExecutionWrapper.wrap`,
`Reloader.run!`, `Reloader.reload!`, the executor middleware). This follows the
same "async where the body awaits" convention as
CLAUDE.md § "A create path awaits its block before saving".

## Acceptance criteria

- `ExecutionWrapper#run` returns the `runCallbacks` result, and `run!` passes it on.
- A test registers an async `to_run` callback on a `Reloader` subclass and
  asserts it has completed when `run!` (awaited) returns.
- A test boots the ActionView trailtie with reloading enabled, touches a watched
  view, and asserts `DetailsKey.digestCaches()` is empty after the awaited
  reloader run.
