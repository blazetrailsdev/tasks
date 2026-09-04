---
title: "CollectionRenderer follows Rails' iterators, render_collection and RenderedCollection"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 280
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails renders a collection through a small iterator hierarchy and two private
methods, none of which trails has:

- `CollectionIterator` / `SameCollectionIterator` / `PreloadCollectionIterator`
  / `MixedCollectionIterator`
  (`vendor/rails/actionview/lib/action_view/renderer/collection_renderer.rb:36-109`)
  wrap the collection and answer `each_with_info`, which is what lets the mixed
  arm carry a per-item path.
- `render_collection(collection, view, path, template, layout, block)`
  (`:153-176`) instruments `render_collection.action_view`, resolves the spacer
  with `find_template(@options[:spacer_template], @locals.keys)`, and returns
  `RenderedCollection.empty(@lookup_context.formats.first)` for an empty body.
- `collection_with_template(view, template, layout, collection)` (`:180-203`)
  mutates one shared `locals` hash, memoises the per-path template in `cache`,
  and passes `implicit_locals: [counter, iteration]` to `template.render`.

`packages/actionview/src/renderer/collection-renderer.ts` instead inlines both
arms: `renderCollectionWithPartial` loops the array directly and
`renderCollectionDerivePartial` re-implements the mixed arm inline rather than
routing through `render_collection(collection, context, nil, nil, nil, block)`
(`:141`). Consequences visible today:

- Both return a `RenderedTemplate`, where Rails returns a `RenderedCollection`
  (or its `EmptyCollection`); `buildRenderedCollection` exists on
  `AbstractRenderer` and is unreachable from here.
- The spacer path is prefixed by hand
  (`"users/" + spacerTemplate` when the partial has a prefix) where Rails looks
  the option up verbatim.
- `@options[:cached]` does not raise `NotImplementedError` on the mixed arm
  (`:136-138`), and `CollectionCaching`'s `cache_collection_render` (`:170`) is
  not reached at all.
- No `render_collection.action_view` instrumentation and no per-path template
  memo.

Surfaced while converging `actionview-partial-renderer-bodies-pass-rails-arguments`
(PR #7373), which ported `retrieve_variable` and the layout arm but left the
iterator/`render_collection` decomposition alone as out of scope.

## Converged shape

`collection-renderer.ts` grows the four iterator classes, `render_collection`
and `collection_with_template` at Rails' names, and both public entry points
end in a `render_collection` call as `:122` and `:141` do — the mixed arm with
`(collection, context, null, null, null, block)`. `RenderedCollection` /
`EmptyCollection` (already ported in `abstract-renderer.ts`) become the return
type, and the spacer is resolved with `find_template(@options[:spacer_template],
@locals.keys)`.

## Acceptance criteria

- The four `CollectionIterator` subclasses, `render_collection` and
  `collection_with_template` exist at Rails' names with Rails' parameters.
- Both entry points return `RenderedCollection` / `EmptyCollection`; the mixed
  arm raises `NotImplementedError` under `@options[:cached]` (`:137`).
- The hand-rolled spacer prefixing is gone.
- `pnpm parity:api --package actionview` does not lose methods, arity or
  params; `parity:api:calls` / `parity:api:calls:args` report no new row.
