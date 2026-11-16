---
title: "PartialRenderer.collection_cache accepts nil, as its cattr_accessor does"
status: draft
updated: 2026-11-16
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `PartialRenderer.collection_cache` is a `cattr_accessor`
(`vendor/rails/v8.0.2/actionview/lib/action_view/renderer/partial_renderer/collection_caching.rb`),
so `action_view.collection_caching` (`vendor/rails/v8.0.2/actionview/lib/action_view/railtie.rb:104-106`)
can assign a nil `app.config.action_controller.cache_store`, and `collection_cache.read_multi`
then raises `NoMethodError`.

trails types the slot `CacheStore` (`packages/actionview/lib/renderer/partial-renderer/collection-caching.ts:24-34`),
so the initializer in `packages/trailties/lib/trailties/action-view.ts` casts
`app.config.actionController.cacheStore as CacheStore` (trails#10193). Widening the slot to
`CacheStore | null` with `collectionCache()!` at the two readers (`:72`, `:164`) breaks typecheck at
roughly ten test call sites (`actionview/test/activerecord/multifetch-cache.test.ts:88`,
`actionview/test/template/render.test.ts:1402-1463`, `actionpack/test/action-controller/controller/caching.test.ts:510,549`).

## Acceptance criteria

- `collectionCache` / `setCollectionCache` accept and answer `CacheStore | null`, as the cattr_accessor does.
- The readers dereference it as Rails does, raising on nil.
- The `as CacheStore` cast in `action-view.ts` is removed; the test call sites are updated.
