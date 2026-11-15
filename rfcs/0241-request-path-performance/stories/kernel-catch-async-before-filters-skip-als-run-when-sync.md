---
title: "kernel-catch-async-before-filters-skip-als-run-when-sync"
status: claimed
updated: 2026-11-15
rfc: "0241-request-path-performance"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-15T19:51:37Z"
assignee: "kernel-catch-async-before-filters-skip-als-run-when-sync"
blocked-by: null
closed-reason: null
---

## Context

An allocation-sampling heap profile (inspector `HeapProfiler.startSampling`
with collected objects included) of `examples/twelve-dollar-server`, 5,000
requests each on `GET /posts/250` and `GET /feed`, on a main with trails#10093,
puts 1.38% of allocated bytes in `Map` under `kernelCatch`
(`packages/ruby-compat/lib/kernel-catch.ts`). Every byte comes from
`Before#call` (`packages/activesupport/lib/callbacks.ts`, the
`kernelCatch(":abort", block)` arm taken when `syncChain` is undefined):
1.04% through `CallbackSequence#invokeBefore` and 0.34% through `_runFilters`.
These are the controller `process_action` chains (`before_action`), which are
async-capable, so `kernelCatchSync` does not apply. Rails:
`vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb:142-158`.

## Acceptance criteria

- A before filter whose callback returns a non-thenable enters no
  `AsyncLocalStorage.run`, on an async-capable chain too, with `throw :abort`
  after an `await` still caught.
- `Map` bytes under `kernelCatch` fall below 0.5% under the same load.
