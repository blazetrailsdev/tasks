---
title: "Production cache stores (MemoryStore/FileStore/NullStore) extend instrumented Store base"
status: in-progress
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 3839
claim: "2026-06-21T21:26:44Z"
assignee: "production-cache-stores-extend-instrumented-base"
blocked-by: null
---

## Context

`Cache::Store` (packages/activesupport/src/cache/store.ts) is the faithful port
of Rails' `ActiveSupport::Cache::Store` base class, including the full
instrumentation framework (`instrument`/`instrumentMulti`/`_instrument` →
`cache_*.active_support` events). However, the _production_ cache stores —
`MemoryStore` (cache/memory-store.ts), `FileStore` (cache/file-store.ts), and
`NullStore` (cache/null-store.ts) — `implements CacheStore` independently and do
NOT extend `Store`. As a result they fire **no** `cache_*.active_support`
events for any operation (read/write/delete/increment/decrement/etc.).

In Rails, the concrete stores (`MemoryStore`, `FileStore`, `MemCacheStore`,
`RedisCacheStore`) all subclass `ActiveSupport::Cache::Store` and inherit the
instrumented public methods, so every operation instruments
(memory_store.rb:149-168, cache.rb:1002-1030). The trails instrumentation work
(PRs #3687, #3703) could only be exercised via the `TestStore` test fixture
because no production store extends `Store`.

## Acceptance criteria

- Production cache stores (`MemoryStore`, `FileStore`, `NullStore`) extend the
  instrumented `Store` base class (or otherwise route their public operations
  through the `instrument`/`instrumentMulti` helpers) so they emit
  `cache_*.active_support` events matching Rails.
- `increment`/`decrement` on the concrete stores instrument with the raw name
  and an `:amount` payload, mirroring Rails `MemoryStore` (already implemented
  for the base/fixture in #3703).
- The `CacheInstrumentationBehavior` tests run against a real production store,
  not only `TestStore`.
- api:compare / test:compare delta non-negative.

This is a larger architectural convergence (the bespoke production stores
predate the base-class port) and is intentionally out of scope for the
~50-LOC #3703 story, which only added increment/decrement instrumentation to
the base framework.
