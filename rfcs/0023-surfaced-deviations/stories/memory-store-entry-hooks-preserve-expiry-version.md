---
title: "MemoryStore/FileStore entry hooks preserve expiry+version so inherited fetchMulti honors expiration"
status: ready
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #3839's `MemoryStore.readEntry`/`FileStore.readEntry`
(`packages/activesupport/src/cache/memory-store.ts`,
`file-store.ts`) build `new Entry(coder.load(encodedValue))` — dropping the
stored `expiresAt` and version. The bespoke public `read`/`write` paths don't
use these hooks, but the **inherited base `fetchMulti`** (and `readMultiEntries`)
does call `readEntry`, so `fetchMulti` on these production stores does not honor
entry expiration or version mismatch the way Rails does
(cache.rb `read_multi_entries` → `read_entry`).

This is a narrow fidelity gap surfaced by extending `Store`: the entry hooks must
round-trip `expiresAt`/version so any base method routed through them behaves
like Rails. Subset of the broader second-unit convergence
[[cache-stores-converge-to-second-unit-entry-storage]] but independently
shippable.

## Acceptance criteria

- `MemoryStore.readEntry` / `FileStore.readEntry` reconstruct the `Entry` with the
  stored expiry and version (mapping the bespoke `CacheEntry` ms `expiresAt` to
  the `Entry` constructor), so `isExpired()`/`isMismatched()` work.
- Add a test exercising `fetchMulti` (inherited) against an expired entry on the
  production `MemoryStore`, asserting Rails-faithful miss + regenerate.
- api:compare / test:compare delta non-negative.
