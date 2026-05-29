---
title: "Phase 2 — pool-based ActiveRecord::QueryCache"
status: ready
rfc: "0004-query-cache-mixin"
cluster: query-cache
deps: ["wire-mixin-cache"]
deps-rfc: []
est-loc: 150
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`query_cache.rb` (`ActiveRecord::QueryCache`) scores 5/5 on `query-cache.ts`, but
two of its methods — `cache` and `uncached` — currently live on the
`QueryCacheAdapter` wrapper. Deleting the wrapper without relocating them drops
the score to 3/5.

Relocate `cache`/`uncached` onto the `QueryCache` class as pool-based static
methods matching Rails' `ActiveRecord::QueryCache::ClassMethods` (operate on
`connection_pool`). Make `run`/`complete` pool-based too (Rails iterates pools,
not adapters). Parity-preserving refactor.

See RFC 0004 §Design (Phase 2).

## Acceptance criteria

- [ ] `cache` / `uncached` relocated onto `QueryCache` as pool-based statics
      (operate on `connection_pool`)
- [ ] `run` / `complete` are pool-based (iterate pools, matching Rails)
- [ ] `query_cache.rb` api:compare stays at 5/5
- [ ] Wrapper no longer required by these methods

## Notes

Subsumes connection-pool-gap-plan **PF2** ("move guard from
`enableQueryCacheBang` to `QueryCache.run`; requires `run()` to accept pools").
The named guard move shipped partially in #2654; the pool-based `run()` modeling
is this story. File: `query-cache.ts`.
