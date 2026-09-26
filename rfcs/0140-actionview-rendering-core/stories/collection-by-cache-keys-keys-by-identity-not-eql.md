---
title: "collectionByCacheKeys keys by identity where Ruby's Hash keys by eql?"
status: in-progress
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: ["actionview", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 80
priority: 10
pr: trails#8154
claim: "2026-09-26T17:42:02Z"
assignee: "journey-route-matches-else-arm-is-case-equality"
blocked-by: null
closed-reason: null
---

## Context

`CollectionCaching#collection_by_cache_keys` (`vendor/rails/actionview/lib/action_view/renderer/partial_renderer/collection_caching.rb:57-68`) builds `hash[key] = item` in a Ruby Hash keyed by the Array cache key. A Hash keys by `eql?`/`hash`, so two collection items whose `expanded_cache_key` Arrays are equal collapse into one entry. `ordered_keys.map { keyed_partials[key] }` (`:51-53`) then resolves both positions to that one rendered partial.

trails' port (`packages/actionview/src/renderer/partial-renderer/collection-caching.ts`, `collectionByCacheKeys` / `fetchOrCachePartial`, after trails#8140) keys a JS `Map` by the Array itself, which is identity. Equal-but-distinct key Arrays stay separate entries, so each duplicate is rendered and written. Output and store contents match Rails. The duplicate render is the divergence.

ruby-compat already has the pieces: `rbHash` (`packages/ruby-compat/src/rb-hash.ts`) and `rbEqual` (`rb-equal.ts`). But `Hash` (`packages/ruby-compat/src/hash.ts:403`) subclasses `Map` with identity keys.

Surfaced in review of trails#8140.

## Converged shape

Key the keyed collection, `cached_partials` lookups and `entries_to_write` by Ruby `eql?` semantics, through an `eql?`-keyed Hash built on `rbHash` / `rbEqual` in ruby-compat, so equal cache-key Arrays collapse as `collection_caching.rb:63-67` does.

## Acceptance criteria

- A cached collection render with two items producing equal cache keys renders the partial once and issues one entry per distinct key in `write_multi`.
- `collection-caching.trails.test.ts` pins that.
