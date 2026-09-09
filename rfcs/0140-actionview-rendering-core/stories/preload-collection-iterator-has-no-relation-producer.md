---
title: "PreloadCollectionIterator is unreachable: no Relation answers preloadAssociations"
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

`CollectionRenderer#render_collection_with_partial`
(`vendor/rails/actionview/lib/action_view/renderer/collection_renderer.rb:112-118`)
picks its iterator on `collection.respond_to?(:preload_associations)`, and
`PreloadCollectionIterator` (`:76-93`) calls `relation.skip_preloading!` unless
`relation.loaded?` and `relation.preload_associations(@collection)` from
`preload!`. That is how `render partial:, collection: Post.all, cached: ->(p){...}`
preloads before the cache keys are computed —
`collection_by_cache_keys` calls `collection.preload!` when the cache key is
callable (`partial_renderer/collection_caching.rb:60`).

All of that is ported in
`packages/actionview/src/renderer/collection-renderer.ts` (PR #7643), but
nothing in trails answers `preloadAssociations`: `packages/activerecord`'s
`Relation` has no `preloadAssociations` / `skipPreloadingBang` /
`isLoaded` triple in the shape the probe wants, so
`rbObjRespondTo(collection, "preloadAssociations")` is always false and
`PreloadCollectionIterator` is unreachable. The declared
`PreloadableRelation` interface in that file exists only to type it.

Rails' side: `preload_associations` and `skip_preloading!` are
`activerecord/lib/active_record/relation.rb`.

## Converged shape

`ActiveRecord::Relation` answers `preloadAssociations(records)` and
`skipPreloadingBang()` at Rails' names, so a collection render over a relation
takes the `PreloadCollectionIterator` branch, and `PreloadableRelation` is
replaced by the real type.

## Acceptance criteria

- Rendering a collection whose collection is an AR relation selects
  `PreloadCollectionIterator`, per `collection_renderer.rb:113-117`.
- `preload!` runs before the cache keys are computed for a callable `cached:`,
  per `collection_caching.rb:60`.
- The locally-declared `PreloadableRelation` interface is gone.
