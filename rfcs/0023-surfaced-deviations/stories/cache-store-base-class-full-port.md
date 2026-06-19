---
title: "Port Cache::Store base class body (cache.rb)"
status: claimed
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: "2026-06-19T23:34:11Z"
assignee: "cache-store-base-class-full-port"
blocked-by: null
---

## Context

PR #3679 ported only the `logger` class attribute from `Cache::Store` (`cache.rb:188-189`).
The full `Cache::Store` class (`cache.rb`) has 58 methods tracked by api:compare (`cache.rb → cache.ts 0/58`).

Key methods remaining:

- `initialize` (options, serializer, compressor, coder, namespace, compress, compress_threshold)
- `silence!` / `mute`
- `fetch`, `read`, `write`, `delete`, `exist?`, `clear`, `cleanup`
- `read_multi`, `write_multi`, `delete_multi`, `delete_matched`
- `increment`, `decrement`
- `raise_on_invalid_cache_expiration_time` (cattr_accessor, cache.rb:190)

The TS file for this is `packages/activesupport/src/cache.ts` (mapped from `cache.rb`), not `cache/store.ts` which has no Rails counterpart.

## Acceptance criteria

- `cache.ts` exists and exports `Store` class (or re-exports from `cache/store.ts` with the class grown to cover remaining methods).
- api:compare coverage for `cache.rb → cache.ts` is > 0%.
- All ported methods have corresponding tests matching Rails test names.
