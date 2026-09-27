---
title: "ActionController::Base#render handles json/plain/html/body in sync arms instead of AbstractController::Rendering#render"
status: draft
updated: 2026-09-27
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Base#render` (`packages/actionpack/src/action-controller/base.ts`) is a hand-written dispatcher. It handles `json:`, `plain:`, `html:`, `body:` and `text:` synchronously in its own branches, and sets hardcoded content types such as `"application/json; charset=utf-8"` and `"text/html; charset=utf-8"`. It defers every template-shaped render (`template:`, `inline:`, `action:`, `partial:`, or a bare call when view paths exist) to `_pendingRender`, which `processAction` drains through `renderAsync`.

trails#8170 ported `ActionView::Rendering#render_to_body` / `#_render_template`. After that PR, `renderAsync` follows `AbstractController::Rendering#render`, and so does `Base#renderToBody`, which runs the Renderers → AC::Rendering → AV::Rendering chain. The synchronous arms still bypass all of it:

- Rails `AbstractController::Rendering#render` (`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/rendering.rb:26-35`) sends every render through `_normalize_render` → `render_to_body` → `_set_html_content_type` / `_set_rendered_content_type rendered_format` → `_set_vary_header` → `response_body=`.
- `json:` belongs to `ActionController::Renderers` (`action_controller/metal/renderers.rb:133-151,156-166`), reached through `_render_to_body_with_renderer`. It does not belong in `Base#render`.
- `plain:` / `html:` / `body:` belong to `ActionController::Rendering#_render_in_priorities` / `_process_options` (`action_controller/metal/rendering.rb:183-187,225-250`).
- `text:` is not a Rails 8 render option at all.
- Because of this, `renderAsync`'s `options[:html]` arm (`_setHtmlContentType`) cannot be reached today: `html:` never leaves the synchronous branch.
- `ActionController::Metal`'s `render` (`action_controller/metal/rendering.rb:164-167`) raises `DoubleRenderError` and then calls `super`. trails raises inline in two places, `render` and `renderAsync`.

## Converged shape

- `Base#render` is `ActionController::Rendering#render` (`if response_body then raise DoubleRenderError end; super`) over `AbstractController::Rendering#render`. `_normalize_render` / `_normalize_args` / `_normalize_options` come first (`abstract_controller/rendering.rb:84-130`, `action_controller/metal/rendering.rb:231-260`). The body always comes from `renderToBody`.
- The sync/async split is kept only where the language forces it, i.e. the async view renderer. It is not kept per option. The synchronous `json` / `plain` / `html` / `body` arms are deleted, and `text:` goes with them.
- `renderAsync` / `_pendingRender` collapse into that single path. Once they have, `renderAsync` is either removed or receipted as the async half of `render`.

## Acceptance criteria

- `render({ json })`, `render({ plain })`, `render({ html })` and `render({ body })` produce their body through `renderToBody` (the Renderers, then `_renderInPriorities`). Their content types come from `_setRenderedContentType` / `_setHtmlContentType`.
- `render({ text })` is removed (not a Rails 8 option).
- The existing actionpack `render_*` Rails test ports stay green.
