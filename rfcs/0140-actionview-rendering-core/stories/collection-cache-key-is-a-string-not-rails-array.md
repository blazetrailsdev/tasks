---
title: "CollectionCaching's cache key is a String where Rails uses combined_fragment_cache_key's Array"
status: draft
updated: 2026-09-09
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`CollectionCaching#expanded_cache_key`
(`vendor/rails/actionview/lib/action_view/renderer/partial_renderer/collection_caching.rb:71-74`)
returns the **Array** `combined_fragment_cache_key` builds
(`vendor/rails/actionpack/lib/abstract_controller/caching/fragments.rb:68-76`),
and hands that Array straight to `collection_cache.read_multi` / `write_multi`.
Rails' `Cache::Store#normalize_key` expands a non-String key one layer down
(`vendor/rails/activesupport/lib/active_support/cache.rb`, `normalize_key` ->
`expand_cache_key`).

trails' `Store#readMulti` / `#writeMulti`
(`packages/activesupport/src/cache/store.ts:266,279`) are typed and implemented
for `string` keys only, and `normalizeKey` takes a `string`. So the port in
`packages/actionview/src/renderer/partial-renderer/collection-caching.ts`
(`expandedCacheKey`) calls `expandCacheKey(...)` itself and returns a String,
which also drops Rails' `key.frozen? ? key.dup : key` arm
(`collection_caching.rb:73`) since a JS string is immutable. Landed in PR #7643.

The Map that `collection_by_cache_keys` builds is keyed by that String, because
a JS `Map`/object cannot key by Array value the way a Ruby Hash can — so the
String is load-bearing for more than the store call.

## Converged shape

`Cache::Store#normalizeKey` accepts Rails' key shapes (Array included) and
expands them via `expandCacheKey`, exactly as `cache.rb`'s `normalize_key` does,
and `readMulti` / `writeMulti` / `fetchMulti` widen to match.
`expandedCacheKey` then returns `view.combinedFragmentCacheKey(...)` unchanged,
with the `frozen?`/`dup` arm ported or explicitly ratified as having no JS
counterpart. `collectionByCacheKeys` keeps a String-keyed Map only if the
Array-keying gap is separately shown to be unbridgeable, and says so at the call
site.

## Acceptance criteria

- `Store#normalizeKey` expands a non-String key through `expandCacheKey`, per
  `activesupport/lib/active_support/cache.rb`'s `normalize_key`.
- `expandedCacheKey`'s body matches `collection_caching.rb:71-74` — no
  `expandCacheKey` call of its own.
- A cached collection render still issues one `readMulti` and one `writeMulti`
  (`collection-caching.trails.test.ts` keeps passing).
