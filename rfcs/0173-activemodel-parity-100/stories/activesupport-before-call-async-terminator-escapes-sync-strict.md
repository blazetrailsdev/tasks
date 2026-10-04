---
title: "activesupport: Before#call lets a promise-returning custom terminator through a sync-strict chain"
status: ready
updated: 2026-10-04
rfc: "0173-activemodel-parity-100"
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

`Filters::Before#call` (`vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb:172-192`) runs the
user callback through the chain's terminator and halts on its answer, synchronously.

trails' `Before#call` (`packages/activesupport/src/callbacks.ts`) has three arms. On a chain a synchronous
caller runs (`env.syncChain` set by `runCallbacks` from `strict: "sync"`, trails PR 8470), two of them raise
`Async callback on sync chain "<name>" — before returned a Promise` when the callback returns a thenable.
The custom-terminator arm does not check the terminator's own return: when `terminatorFn(target, fn)` returns
a thenable, `call` returns `Promise.resolve(halt).then(...)` whatever `env.syncChain` holds. `_runFilters` then
chains the remaining filters behind that promise and `runCallbacks` returns a Promise to a caller that asked
for a synchronous chain, so the halt decision and every later before filter run after the caller has moved on.

Seen while moving the sync-strict mode from the `invokeBefore` / `invokeAfter` argument list onto the
environment (trails PR 8470); that PR kept the arm as it was.

## Acceptance criteria

- [ ] On a chain run with `strict: "sync"`, a custom terminator that returns a thenable raises the same `Async callback on sync chain "<name>"` `RuntimeError` the other two arms raise, with the thenable's rejection swallowed, and no later filter runs.
- [ ] A `.trails.test.ts` test in `packages/activesupport/src/callbacks.trails.test.ts` covers it and fails on the current body.
- [ ] Without `strict: "sync"` the arm is unchanged.
