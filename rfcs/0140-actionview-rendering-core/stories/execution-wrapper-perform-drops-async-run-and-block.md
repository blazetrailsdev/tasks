---
title: "ExecutionWrapper.perform drops an async to_run and completes before an async block"
status: ready
updated: 2026-09-27
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ExecutionWrapper.perform` (`vendor/rails/v8.0.2/activesupport/lib/active_support/execution_wrapper.rb:98-106`)
is `instance = new; instance.run; begin yield ensure instance.complete end`: the
`run` callbacks finish before the block, and `complete` runs after the block
returns. trails#8168 made `ExecutionWrapper#run` / `#complete` return the
`runCallbacks` result and awaited it in `run!`, `wrap`, `Reloader.run!` /
`wrap` / `reload!` and the executor middleware. `perform`
(`packages/activesupport/src/execution-wrapper.ts`, `static perform`) was left
as it was. It drops a promise from an async `to_run`, so the block starts before
the run callbacks finish. It also calls `complete` in a sync `finally`, so an
async block completes early.

## Converged shape

`perform` follows `wrap`'s settled shape. When `instance.run()` returns a
thenable, an async arm awaits it, then awaits the block and `instance.complete()`
in `finally`. The sync arm defers `complete` until an async block settles.

## Acceptance criteria

- An async `to_run` callback has completed before `perform`'s block runs.
- `complete` runs after an async block settles.
- A `.trails.test.ts` cover for each; both fail on the pre-change body.
