---
title: "<%= render collection: %> in a template gets a Promise from the async CollectionRenderer"
status: ready
updated: 2026-09-27
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`RenderingHelper#render` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/rendering_helper.rb:138-155`)
returns the rendered String synchronously on every arm. That includes
`render partial: "x", collection: records` inside a template, which reaches
`CollectionRenderer#render_collection_with_partial`
(`renderer/collection_renderer.rb`) through `Renderer#render_partial_to_object`
(`renderer/renderer.rb:55-77`).

Since trails#8168, trails' `Base#render` (`packages/actionview/src/base.ts`)
dispatches through `viewRenderer`. Every arm is synchronous except the
collection arm: `CollectionRenderer` (`packages/actionview/src/renderer/collection-renderer.ts`)
is `async` throughout (`renderCollection`, `collectionWithTemplate`,
`eachWithInfo`, `preloadBang`), because a relation collection's preload is
awaited. So `<%= render partial: "post", collection: posts %>` in a compiled
(synchronous) template gets a Promise back from `Base#render`, and
`OutputBuffer#append` escapes it as `[object Promise]`. Before #8168 the same
call silently ignored `collection:` through `renderPartialSync`, so this was
never supported. It just fails differently now.

## Converged shape

`CollectionRenderer` renders synchronously whenever its collection is an
already-loaded Array, as Rails' does. Only the relation preload
(`PreloadCollectionIterator#preload!`) stays async. The async arm is reached
only when a relation that is not yet loaded has to be preloaded, and that case
is loud rather than stringified. See `preload-collection-iterator-has-no-relation-producer`
and `collection-renderer-follows-rails-iterators-and-render-collection` for the
iterator shape this builds on.

## Acceptance criteria

- `<%= render partial: "x", collection: [a, b] %>` inside a template renders
  both partials joined by the spacer, per `collection_renderer.rb`.
- `render partial: "x", collection: []` in a template renders nothing (nil body).
- A cover ports the matching `actionview/test/template/render_test.rb`
  collection cases (`test_render_partial_collection` and siblings) through
  `view.render`.
