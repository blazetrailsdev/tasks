---
title: "Base#viewRenderer / #lookupContext are writable fields where Rails has attr_reader"
status: done
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 60
priority: 10
pr: trails#8157
claim: "2026-09-26T18:42:05Z"
assignee: "port-mapping-initialize-and-make-route"
blocked-by: null
closed-reason: null
---

## Context

`ActionView::Base` declares `attr_reader :view_renderer, :lookup_context` (`vendor/rails/actionview/lib/action_view/base.rb:218`). Both are public readers. Only the class's own code writes the ivars: `initialize` (`:244-249`) and `in_rendering_context` (`:290-309`), which swaps `@view_renderer` / `@lookup_context` and restores them in `ensure`.

trails ports both as plain public writable fields (`packages/actionview/src/base.ts`: `viewRenderer: Renderer`, `lookupContext: LookupContext | null`). `viewRenderer` was added in trails#8140. `inRenderingContext` also does not yet swap `viewRenderer` the way `base.rb:302` does (`@view_renderer = ActionView::Renderer.new @lookup_context`). It yields the `LookupContext` itself, on the `*Sync` path.

Surfaced in review of trails#8140.

## Converged shape

- `viewRenderer` and `lookupContext` are public getters over internal storage. That is the TS spelling of `attr_reader` with ivar writes kept inside the class.
- `inRenderingContext` rebuilds and restores `viewRenderer` alongside `lookupContext`, per `base.rb:290-309`.

## Acceptance criteria

- `view.viewRenderer = x` from outside the class is a type error.
- `inRenderingContext` with `formats:` yields a view whose `viewRenderer` wraps the swapped lookup context, and restores both afterwards.
