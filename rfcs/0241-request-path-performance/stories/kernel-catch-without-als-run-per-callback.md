---
title: "kernelCatch and Monitor#synchronize avoid an AsyncLocalStorage.run per call"
status: ready
updated: 2026-11-13
rfc: "0241-request-path-performance"
cluster: request-perf
packages: [ruby-compat]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`kernelCatch` (`packages/ruby-compat/lib/kernel-catch.ts`, about `:145-164`)
enters `context.run(tt, …)` on every call. With Node's `AsyncContextFrame`,
each `run` allocates a new frame `Map`. `ActiveSupport::Callbacks` runs every
filter through `kernelCatch` (`callbacks.js:245` → `_runFilters`), and
`monSynchronize` (`monitor.ts`) does the same. Sampled share: **4.6%** of
allocated bytes in `Map`, and 1.8% of the 4.5% under `next`, from
`kernelCatch` and `monSynchronize` together. The CPU profile also shows
`AsyncContextFrame` and `getStore` on the hot path.

## Acceptance criteria

- The callback filter chain and monitor entry run without one
  `AsyncLocalStorage.run` per call when no `throw` can target the tag, for
  example by tracking the tag on a cheap stack and entering ALS only across an
  `await`. Ruby semantics stay the same: a matching `throw` unwinds to the
  innermost `catch`, including across an async block.
- The `kernel-catch` and `monitor` tests stay green, and a new test covers a
  `throw` from inside an awaited callback.
- `Map` allocations under `kernelCatch` and `monSynchronize` fall below 0.5% of
  bytes under the twelve-dollar load.
