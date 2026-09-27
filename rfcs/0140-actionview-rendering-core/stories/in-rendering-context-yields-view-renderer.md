---
title: "in-rendering-context-yields-view-renderer"
status: done
updated: 2026-09-27
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8169
claim: "2026-09-27T00:22:02Z"
assignee: "in-rendering-context-yields-view-renderer"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Base#in_rendering_context` yields `@view_renderer`
(`vendor/rails/v8.0.2/actionview/lib/action_view/base.rb:290-309`, `yield @view_renderer`),
and `Helpers::RenderingHelper#render` renders through that renderer
(`helpers/rendering_helper.rb`, `view_renderer.render(self, options)` /
`render_partial`). trails' `Base#inRenderingContext` (`packages/actionview/src/base.ts`)
swaps and restores `viewRenderer` since trails#8157. It still yields the
`LookupContext`, though, and `Base#render` calls `renderer.renderPartialSync`
on it, a synchronous LookupContext path, not the `Renderer`.

## Acceptance criteria

- `inRenderingContext` yields `this.viewRenderer`, per `base.rb:307`.
- `Base#render` renders through the yielded `Renderer`, as `rendering_helper.rb` does, and the `renderPartialSync` detour is gone.
