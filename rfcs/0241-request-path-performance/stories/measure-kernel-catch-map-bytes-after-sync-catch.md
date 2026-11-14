---
title: "measure-kernel-catch-map-bytes-after-sync-catch"
status: draft
updated: 2026-11-14
rfc: "0241-request-path-performance"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10093 routes `ActiveSupport::Callbacks` sync chains
(`packages/activesupport/lib/callbacks.ts`, the before filter and
`Before.build`) through `kernelCatchSync` (`packages/ruby-compat/lib/kernel-catch.ts`),
so they enter no `AsyncLocalStorage.run`. No heap profile under load was taken.
The story `kernel-catch-without-als-run-per-callback` measured 4.6% of
allocated bytes in `Map` from `kernelCatch` and `monSynchronize` together.

## Acceptance criteria

- A `--heap-prof` sample of `examples/twelve-dollar-server` at 5,000 users on
  a main that includes trails#10093 states `Map` bytes under `kernelCatch`.
- If async chains still dominate, file a story naming the remaining callers.
