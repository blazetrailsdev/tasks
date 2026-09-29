---
title: "template-render-returns-output-buffer-to-s"
status: done
updated: 2026-09-29
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8251
claim: "2026-09-29T19:33:03Z"
assignee: "template-render-returns-output-buffer-to-s"
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionView::Template#render`
(`vendor/rails/v8.0.2/actionview/lib/action_view/template.rb:261-276`) returns
`result.is_a?(OutputBuffer) ? result.to_s : result`, and `OutputBuffer#to_s`
(`vendor/rails/v8.0.2/actionview/lib/action_view/buffers.rb:36-38`) is
`@raw_buffer.html_safe`, so every rendered template body is an html_safe
`SafeBuffer`. `RenderingHelper#render`
(`helpers/rendering_helper.rb:138-155`) returns that body unwrapped, and
`<%= render ... %>` appends it without escaping.

trails' `Template#render` (`packages/actionview/src/template.ts`, the `render`
body) returns `result.toStr()` — a plain string — so `Base#render`
(`packages/actionview/src/base.ts`) wraps every renderer body in the
module-private `renderedBody` (`htmlSafe(String(body))`), receipted
`@noRailsEquivalent CONVERGEABLE template-render-returns-output-buffer-to-s`.
That also marks `render plain:` / `body:` / `file:` bodies safe, where Rails'
`Template::Text#render` / `RawFile#render` return an unsafe String that
`<%= %>` escapes.

## Acceptance criteria

- `Template#render` returns `result.toString()` (the `SafeBuffer`) for an
  `OutputBuffer` result, as `template.rb:272` does; `RenderedTemplate#body`
  and the renderer return types widen accordingly.
- `renderedBody` is deleted from `base.ts`; `Base#render` returns the
  renderer body as Rails does.
- A cover asserts `<%= render plain: "<b>" %>` escapes and
  `<%= render partial: ... %>` does not.
