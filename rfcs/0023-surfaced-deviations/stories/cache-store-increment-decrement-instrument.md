---
title: "instrument Cache::Store increment/decrement (cache_increment/cache_decrement)"
status: in-progress
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 3703
claim: "2026-06-20T11:34:43Z"
assignee: "cache-store-increment-decrement-instrument"
blocked-by: null
---

## Context

`Cache::Store` instrumentation was ported in PR #3687 (story
`cache-store-notifications-instrument`), wrapping fetch/read/write/delete/exist?/
read_multi/write_multi/delete_multi/fetch_hit/generate. Two operations were left
out because they are unimplemented strategy hooks on the base class.

Rails `CacheInstrumentationBehavior` also asserts `cache_increment.active_support`
and `cache_decrement.active_support`
(vendor/rails/activesupport/test/cache/behaviors/cache_instrumentation_behavior.rb:121-148).
In Rails these fire from the concrete store implementations (e.g.
`MemoryStore#increment` / `#decrement`), each wrapping the body in
`instrument(:increment, name, amount: amount)` /
`instrument(:decrement, name, amount: amount)` with an `:amount` payload
(vendor/rails/activesupport/lib/active_support/cache/memory_store.rb).

In trails, `Store.increment`/`Store.decrement`
(packages/activesupport/src/cache/store.ts) throw `NotImplementedError`
(`@nie disposition=keep-as-strategy-hook`), so the instrumentation belongs in the
concrete store(s) that implement those operations, not the base class.

## Acceptance criteria

- The concrete cache store(s) that implement `increment`/`decrement` wrap the
  operation in `this.instrument("increment", name, { amount })` /
  `this.instrument("decrement", name, { amount })`, firing
  `cache_increment.active_support` / `cache_decrement.active_support` with an
  `:amount` payload (and `:key`, `:store` from the shared `instrument` helper).
- Tests named `test_increment_instrumentation` / `test_decrement_instrumentation`
  (matching Rails verbatim) verify the event fires and the payload includes
  `:key`.
- api:compare delta non-negative; LOC ceiling ≤ 500.
