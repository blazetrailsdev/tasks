---
title: "PreloadCollectionIterator is unreachable: no Relation answers preloadAssociations"
status: ready
updated: 2026-09-26
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
`packages/actionview/src/renderer/collection-renderer.ts` (PR #7643).

**The original premise here was wrong.** Checked against main on 2026-09-26:
`Relation` already answers both names. `preloadAssociations(records)` is at
`packages/activerecord/src/relation.ts` (`async`, the port of
`relation.rb:1321-1328`), and `skipPreloadingBang` is in
`relation/query-methods.ts` (the port of `query_methods.rb:1513`). So
`rbObjRespondTo(collection, "preloadAssociations")` is already true for a
relation. What actually keeps the branch from working:

1. **`loaded?` is a getter.** `Relation#isLoaded` is `get isLoaded()`, but
   `PreloadCollectionIterator`'s constructor calls `relation.isLoaded()`, which
   throws a `TypeError` on a real relation.
2. **The preload is async.** `Relation#preloadAssociations` returns a promise,
   but `PreloadCollectionIterator#preloadBang` (and `CollectionIterator#preloadBang`,
   `collection_caching.ts`'s `collection.preloadBang()`) are synchronous. The
   promise is dropped.
3. **The relation is never loaded before a synchronous iterator reads it.**
   `collection_from_options` (`renderer.rb:96-101`) hands the relation itself to
   `render_collection_with_partial`. Rails' iterators then load it in place
   through `@collection.each` / `.length` / `.size`
   (`collection_renderer.rb:17-40`). trails' `CollectionIterator` calls
   `this.collection.forEach` / `.length`, which a `Relation` does not answer
   synchronously. Its `records()` / `load()` / `size()` are all async, per
   CLAUDE.md § "`Relation` is evaluated by an async query".
4. **`Preloader` wants records, not a relation.** Rails passes the relation as
   `records:` (`preload_associations(@collection)`), and `Preloader` loads it.
   trails' `Preloader.new({ records })` takes an array.
5. **actionview cannot import `Relation`.** activerecord devDepends on
   actionview, so "replace `PreloadableRelation` by the real type" is not
   available as an import. Rails' actionview never names AR either: the probe
   is duck-typed.

So the work is to decide where the one awaited `load` of a relation-backed
collection happens. It has to come after `skip_preloading!`, which the
iterator's constructor runs, and before the first synchronous read, the
`count: collection.length` in `render_collection`'s instrument payload
(`collection_renderer.rb:142-146`). Then make `preload!` awaited along the
`collection_with_template` / `collection_by_cache_keys` paths. That is a
renderer-wide async decision, not a missing method.

## Converged shape

A collection render over an AR relation takes the `PreloadCollectionIterator`
branch and runs it end to end. The relation is skipped for preloading, loaded
once, has its associations preloaded before the callable cache keys are
computed, and is iterated over its loaded records. The structural
`PreloadableRelation` type matches the relation's real surface: `isLoaded` as
a getter, and an awaited `preloadAssociations`.

## Acceptance criteria

- Rendering a collection whose collection is an AR relation selects
  `PreloadCollectionIterator`, per `collection_renderer.rb:113-117`, and renders
  its records (an activerecord-side test, since actionview cannot import AR).
- `preload!` runs, awaited, before the cache keys are computed for a callable
  `cached:`, per `collection_caching.rb:60`.
- `PreloadableRelation` either goes, or, because actionview cannot import AR,
  is kept as the duck type with a receipt naming that edge. It no longer
  declares `isLoaded()` as a method.
