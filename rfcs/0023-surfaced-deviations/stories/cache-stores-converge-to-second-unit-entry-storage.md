---
title: "Converge production cache stores to Rails second-unit Entry storage (inherit base read/write/fetch)"
status: claimed
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: "2026-06-21T23:26:54Z"
assignee: "cache-stores-converge-to-second-unit-entry-storage"
blocked-by: null
---

## Context

PR #3839 made the production cache stores (`MemoryStore`/`FileStore`/`NullStore`,
`packages/activesupport/src/cache/`) extend the instrumented `Cache::Store` base
and emit `cache_*.active_support` events. But `MemoryStore` and `FileStore` keep
their **bespoke millisecond-unit storage model** (`entry-record.ts` `CacheEntry`
with `expiresAt` in epoch-ms, `coder` serialization) rather than Rails'
second-unit `Entry` (`entry.ts`, `expiresIn * 1000`). Because of the unit
mismatch they could not simply inherit the base `read`/`write`/`fetch`; they
re-wrap their existing bodies with `this.instrument(...)` instead.

This is the larger architectural convergence deferred at PR #3839 (which sat at
the 500-LOC ceiling). Rails concrete stores subclass `Store`, override only the
private `read_entry`/`write_entry`/`delete_entry` hooks, and inherit the
instrumented public methods (memory_store.rb, file_store.rb, cache.rb:1002-1030).

## Acceptance criteria

- `MemoryStore`/`FileStore` store Rails `Entry` objects (second-unit `expiresIn`)
  and inherit the base `read`/`write`/`delete`/`exist?`/`fetch`/`*_multi` public
  methods instead of re-wrapping bespoke millisecond bodies.
- `race_condition_ttl` handling moves into the base `handleExpiredEntry`
  (cache.rb), matching Rails, so `MemoryStore` no longer needs its own `fetch`.
- Existing store behaviors (LRU/prune for MemoryStore, file layout for FileStore)
  preserved; bespoke `stores/*.test.ts` converted from ms to second units.
- api:compare / test:compare delta non-negative.
- Likely exceeds 500 LOC; split into MemoryStore and FileStore sub-stories if so.
