---
title: "action-controller-rendering-modules-join-super-chain"
status: draft
updated: 2026-09-30
rfc: "0161-actioncontroller-rendering-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8266 made `AbstractController::Rendering` (`packages/actionpack/src/abstract-controller/rendering.ts`, `Rendering`) and `ActionView::Rendering` (`packages/actionview/src/rendering.ts`, `Rendering`) live ruby-compat `Module`s, included into `ActionController::Base` in `vendor/rails/v8.0.2/actionpack/lib/action_controller/base.rb:222-266` order. The modules that Rails includes after them still assign their overrides straight onto `Base.prototype` (`packages/actionpack/src/action-controller/base.ts`, the `Base.prototype.x = x` block), and they reach the method below them through direct calls instead of `super`:

- `ActionView::Layouts#_process_render_template_options` (`vendor/rails/v8.0.2/actionview/lib/action_view/layouts.rb:350-358`) calls `super`; trails' `layouts.ts` calls `renderingProcessRenderTemplateOptions.call(this, …)`.
- `ActionController::Rendering` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/rendering.rb:165-257`): `render`, `render_to_string`, `render_to_body`, `_normalize_options` and `_process_options` call `super`. trails' `metal/rendering.ts` calls `abstractRender` / `abstractRenderToString` directly, and `Base#renderToBody` calls `actionViewRenderToBody.call(this, …)`.
- `ActionController::Renderers#render_to_body` (`metal/renderers.rb:139-141`) is `_render_to_body_with_renderer(options) || super`.
- `ActionController::Streaming#_render_template` (`metal/streaming.rb:172-181`) calls `super`; trails' `metal/streaming.ts` calls `actionViewRenderTemplate.call(this, …)`.

## Acceptance criteria

- `ActionView::Layouts`, `ActionController::Rendering`, `ActionController::Renderers` and `ActionController::Streaming` reach `ActionController::Base` as included modules in `base.rb:222-266` order.
- Each override listed above calls `super` through its module's `superMethod`, as the Rails body does, and the matching `Base.prototype.x = x` assignment and direct `.call(this)` pseudo-super are deleted.
