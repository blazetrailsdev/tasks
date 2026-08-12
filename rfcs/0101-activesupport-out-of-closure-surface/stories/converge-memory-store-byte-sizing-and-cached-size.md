---
title: "converge-memory-store-byte-sizing-and-cached-size"
status: done
updated: 2026-08-12
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6437
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `converge-store-serialized-entry-hooks-and-file-store-paths`, which
converged MemoryStore's entry hooks onto the Rails payload split
(`write_entry` → `serialize_entry`, `read_entry` → `deserialize_entry`) but left
its _sizing_ model unported.

Rails (`activesupport/lib/active_support/cache/memory_store.rb:196-236`) budgets
the store in BYTES:

- `PER_ENTRY_OVERHEAD = 240` and
  `cached_size(key, payload) = key.to_s.bytesize + payload.bytesize + PER_ENTRY_OVERHEAD`.
- `@max_size = options[:size] || 32.megabytes`, `@cache_size` maintained in
  `write_entry` (`@cache_size -= (old_payload.bytesize - payload.bytesize)` on
  overwrite, `+= cached_size(...)` otherwise) and `delete_entry`.
- `write_entry` calls `prune(@max_size * 0.75, @max_prune_time)` once
  `@cache_size > @max_size`; `prune` is the byte-target LRU
  (memory_store.rb:100-127) with `@pruning` and instrumentation.

trails (`packages/activesupport/src/cache/memory-store.ts`) instead counts
ENTRIES: a `sizeLimit` constructor option, an `evictLRU()` that drops one entry,
and a `prune(targetSize)` whose target is an entry count. `cachedSize`,
`PER_ENTRY_OVERHEAD`, `maxSize`, `cacheSize`, `maxPruneTime` and `isPruning` are
all missing.

## Acceptance criteria

- `cachedSize`, `PER_ENTRY_OVERHEAD`, `maxSize`/`cacheSize` accounting and the
  byte-target `prune` mirror memory_store.rb:100-127 and 196-236, with the Rails
  `:size` option name and 32MB default.
- `evictLRU` (a trails invention) is gone; pruning happens where Rails prunes.
- `pnpm parity:api` delta non-negative.
