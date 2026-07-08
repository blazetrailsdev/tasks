---
title: "CallbackChain.compile should memoize the compiled sequence (Rails @all_callbacks)"
status: claimed
updated: 2026-07-08
rfc: "0058-module-generation-mechanism"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-07-08T02:09:22Z"
assignee: "callbackchain-memoize-compiled-sequence"
blocked-by: null
closed-reason: null
---

## Context

Rails' `CallbackChain#compile`
(`vendor/rails/activesupport/lib/active_support/callbacks.rb`) memoizes the
built `CallbackSequence` in `@all_callbacks` (and `@single_callbacks[type]`),
rebuilding only when the chain mutates (append/prepend/insert/delete/clear
reset the memo). trails' `CallbackChain.compile()` re-folds the whole chain
(`callback.compiled.apply(sequence)`) on every `runCallbacks` — a hot path hit
on every save/validate/destroy.

Surfaced during PR #4702 (drive no-around chains through the compiled
CallbackSequence).

## Acceptance criteria

- [ ] Memoize the compiled sequence on `CallbackChain`, invalidating on chain
      mutation (append/prepend/insert/delete/clear), mirroring Rails'
      `@all_callbacks` reset points.
- [ ] No mutex needed (single-threaded JS); document that deviation from Rails'
      `@mutex.synchronize`.
- [ ] Callback tests stay green; no test renamed.
