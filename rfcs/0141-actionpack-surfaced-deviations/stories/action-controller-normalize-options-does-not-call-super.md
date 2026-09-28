---
title: "ActionController::Rendering#_normalize_options does not continue to the ActionView/Layouts _normalize_options"
status: draft
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Rendering#_normalize_options` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/rendering.rb:227-239`) ends with `super`. That call continues into `ActionView::Layouts#_normalize_options` (layout defaulting) and `ActionView::Rendering#_normalize_options`, and finally `AbstractController::Rendering#_normalize_options` (`abstract_controller/rendering.rb:88-90`).

trails' `_normalizeOptions` (`packages/actionpack/src/action-controller/metal/rendering.ts`) returns `options` without continuing the chain. Since trails#8203, `ActionController::Base#render` routes through `_normalizeRender` → `this._normalizeOptions` (`Base.prototype._normalizeOptions` is AC's), so the missing `super` is live on every controller render. trails does the layout defaulting elsewhere instead (`_processRenderTemplateOptions` in `actionview/src/layouts.ts`).

## Acceptance criteria

- AC `_normalizeOptions` calls the ActionView/Layouts `_normalize_options` next, in Rails' ancestor order, ending at the abstract identity.
- Layout option defaulting happens where Rails does it (`Layouts#_normalize_options`) rather than being duplicated in `_processRenderTemplateOptions`.
