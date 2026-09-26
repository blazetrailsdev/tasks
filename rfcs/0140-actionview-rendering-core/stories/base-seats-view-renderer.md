---
title: "Base seats @view_renderer (base.rb:249) — async renderers read view.viewRenderer"
status: draft
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
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

`ActionView::Base#initialize` seats `@view_renderer = ActionView::Renderer.new @lookup_context`
(`vendor/rails/v8.0.2/actionview/lib/action_view/base.rb:249`, reader at `:218`), and
`in_rendering_context` swaps it (`:293-305`). trails' `Base`
(`packages/actionview/src/base.ts`) has no `viewRenderer` at all, yet the async renderers
read `view.viewRenderer.cacheHits[...]` (`renderer/partial-renderer.ts` `renderPartialTemplate`,
`partial_renderer.rb:256`). A real `Base` handed to `Renderer#renderPartial` throws
`Cannot read properties of undefined (reading 'cacheHits')`; PR #8136's
`renderer/partial-renderer.trails.test.ts` had to `Object.assign` a renderer onto the view.

## Acceptance criteria

- `Base` constructor seats `viewRenderer = new Renderer(lookupContext)` per `base.rb:249`, with the `attr_reader`.
- `inRenderingContext` saves/restores `viewRenderer` per `base.rb:293-305`.
- `partial-renderer.trails.test.ts` drops its `Object.assign` seat.
