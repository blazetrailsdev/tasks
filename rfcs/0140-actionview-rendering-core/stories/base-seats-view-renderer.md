---
title: "Base seats @view_renderer (base.rb:249) — async renderers read view.viewRenderer"
status: closed
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
closed-reason: "Delivered by trails#8140 (47ac0ed7e4): origin/main packages/actionview/src/base.ts:201 seats 'this.viewRenderer = new Renderer(this.lookupContext!)' (base.rb:249) and :140 declares the field. Residual AC (inRenderingContext swap/restore of viewRenderer per base.rb:293-305, attr_reader shape — which also forces partial-renderer.trails.test.ts:25's Object.assign seat out) is owned by view-renderer-is-a-writable-field-not-attr-reader."
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
