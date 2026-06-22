---
title: "memory-store-increment-deletematched-rails-fidelity"
status: done
updated: 2026-06-22
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 40
pr: 3853
claim: "2026-06-22T00:22:41Z"
assignee: "memory-store-increment-deletematched-rails-fidelity"
blocked-by: null
---

## Context

Follow-up from review of #3848
(`cache-stores-converge-to-second-unit-entry-storage`), which converged
`MemoryStore` to inherit the base `Cache::Store` read/write/fetch and store
second-unit `Entry` records. Three `MemoryStore` helper methods were rewritten to
fit the new record shape but kept their **pre-existing trails semantics**, which
diverge from Rails `memory_store.rb`. They are tracked here for convergence (not
ratified).

1. `modify_value` (memory_store.rb:241-258). Rails: when
   `!entry || entry.expired? || entry.mismatched?(version)` it **creates** the key
   set to `Integer(amount)` (`write(name, Integer(amount), options); amount`) — so
   `cache.increment("foo") # => 1` (doc at memory_store.rb:136). trails
   `modifyValue` returns `null` for a missing/expired record, has no
   version-mismatch branch, and increments in place with `Number`/`isNaN`→null
   rather than re-`write`ing through the instrumented path with `Integer(amount)`
   (raises on non-int) and `entry.value.to_i`.
2. `delete_matched` (memory_store.rb:170-180). Rails applies
   `matcher = key_matcher(matcher, options)` after `merged_options` — prefixing the
   namespace into the regex source — before matching against stored keys. trails
   tests the raw regex against already-namespaced stored keys and passes no options
   through `mergedOptions`, so a namespaced store does not scope `delete_matched`
   the way Rails does.
3. `cleanup` (memory_store.rb:101) does not call `merged_options(options)`. No
   behavioral impact today (it ignores options) — fidelity note only.

## Acceptance criteria

- `MemoryStore` `increment`/`decrement` create the key set to `amount` and return
  `amount` on a missing/expired/version-mismatched entry, mirroring Rails
  `modify_value`; on hit they preserve `expiresAt`/`version` and use
  integer-truncation semantics. Update the bespoke trails test asserting
  `increment` returns `null` for a missing key to the Rails behavior (read the
  corresponding Rails `CacheIncrementDecrementBehavior` test first).
- `deleteMatched` applies a Rails-equivalent `keyMatcher` (namespace prefixing)
  via `mergedOptions` before matching.
- `cleanup` threads `mergedOptions(options)` for signature fidelity.
- api:compare / test:compare delta non-negative. 500-LOC ceiling, single PR.
- Hard rules: NO `node:*` imports, NO `process.*` refs, no new runtime deps.
