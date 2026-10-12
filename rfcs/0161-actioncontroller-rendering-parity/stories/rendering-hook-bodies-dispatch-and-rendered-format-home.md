---
title: "Rendering hook bodies take Rails' shape; respond_to dispatches _set_rendered_content_type; rendered_format lives on ActionView::Rendering"
status: in-progress
updated: 2026-10-12
rfc: "0161-actioncontroller-rendering-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8824
claim: "2026-10-12T17:13:59Z"
assignee: "controller-class-render-is-typed-on-base"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while landing trails#8772. Three bodies around the rendering content-type hooks still differ from Rails.

1. `ActionController::Rendering`'s private hooks (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/rendering.rb:197-222`) in `packages/actionpack/src/action-controller/metal/rendering.ts`:
   - `_set_html_content_type` is `self.content_type = Mime[:html].to_s` (`:210-212`); trails assigns the literal `"text/html"`.
   - `_set_vary_header` is `response.headers["Vary"].blank? && request.should_apply_vary_header?` then `response.headers["Vary"] = "Accept"` (`:220-224`); trails reads `getHeader("Vary") ?? getHeader("vary")`, hand-rolls the blank test instead of `isBlank`, calls `shouldApplyVaryHeader?.()` behind an optional probe, and writes with `setHeader`.
   - `_process_variant` guards `defined?(request) && !request.nil? && request.variant.present?` (`:197-201`); trails folds the guard into `this.request?.variant`.
   - `render_to_string` tests `result.respond_to?(:each)` (`:181-190`); trails tests `Symbol.iterator` and excludes strings by `typeof`.
2. `ActionController::MimeResponds#respond_to` calls `_set_rendered_content_type(format)` on `self` (`metal/mime_responds.rb:222`). `packages/actionpack/src/action-controller/metal/mime-responds.ts:108` calls the imported function, `_setRenderedContentType.call(this, format)`, which skips method dispatch, so a controller or module override of the hook is never reached.
3. `rendered_format` is `attr_internal_reader :rendered_format` on `ActionView::Rendering` (`vendor/rails/v8.0.2/actionview/lib/action_view/rendering.rb:30`), with `@_rendered_format = nil` in its `initialize` (`:32-35`). trails defines `renderedFormat()` as a method on `ActionController::Base` (`packages/actionpack/src/action-controller/base.ts`, `renderedFormat`), not on the `ActionView::Rendering` module in `packages/actionview/src/rendering.ts`, so a class that includes `ActionView::Rendering` without being a `Base` falls back to `AbstractController::Rendering#rendered_format` (`Mime[:text]`).

## Acceptance criteria

- The four `metal/rendering.ts` bodies read as the Rails bodies above: `Mime.get("html").toString()`, `isBlank` on `response.headers` `"Vary"`, an unconditional `request.shouldApplyVaryHeader()`, Rails' three-part `_process_variant` guard, and `rbObjRespondTo(result, "each")`.
- `respondTo` calls `this._setRenderedContentType(format)`.
- `renderedFormat` is defined on the `ActionView::Rendering` module and removed from `ActionController::Base`.
- `pnpm parity:api:calls` and `pnpm parity:api:extra:gate` stay green.
