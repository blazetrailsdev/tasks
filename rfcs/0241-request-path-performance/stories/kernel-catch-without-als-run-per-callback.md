---
title: "kernelCatch avoids an AsyncLocalStorage.run per sync callback filter"
status: claimed
updated: 2026-11-14
rfc: "0241-request-path-performance"
cluster: request-perf
packages: [ruby-compat, activesupport]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-11-14T14:01:13Z"
assignee: "kernel-catch-without-als-run-per-callback"
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

- The synchronous callback filter chain runs without one
  `AsyncLocalStorage.run` per filter. Ruby semantics stay the same: a matching
  `throw` unwinds to the innermost `catch`, including across an async block.
- The `kernel-catch` tests stay green, and a new test covers a `throw` from
  inside an awaited callback.

Split: monitor entry is `mon-synchronize-without-als-run-for-sync-blocks`, and
the load measurement is `measure-kernel-catch-map-bytes-after-sync-catch`.
