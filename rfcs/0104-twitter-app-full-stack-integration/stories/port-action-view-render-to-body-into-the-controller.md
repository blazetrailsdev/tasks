---
title: "port-action-view-render-to-body-into-the-controller"
status: draft
updated: 2026-09-07
rfc: "0104-twitter-app-full-stack-integration"
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

`ActionController::Base` cannot render a template. `AbstractController::Rendering#render`
(`vendor/rails/actionpack/lib/abstract_controller/rendering.rb:25`) dispatches to
`render_to_body`, which `ActionView::Rendering#render_to_body`
(`vendor/rails/actionview/lib/action_view/rendering.rb:118-127`) overrides to run
`_render_template(options)` through the view renderer. That override is not ported:
`packages/actionview/src/rendering.ts` declares `renderToBody` on the `Rendering`
interface (line 28) and never implements it, so `ActionController::Metal#renderToBody`
(`packages/actionpack/src/action-controller/metal.ts:364`) falls through to
`_renderInPriorities`, which only knows `body:` / `plain:` / `html:`. A controller
action doing `this.render({ inline: "<%= 1 + 1 %>" })` produces an empty body.

Found while enrolling `log_subscriber_test.rb`'s seven fragment-cache tests (#TBD,
story `enroll-the-fragment-cache-log-subscriber-tests`). Rails' six caching actions
(`vendor/rails/actionpack/test/controller/log_subscriber_test.rb:51-72`) are each a
`render inline: "<%= cache('foo'){ 'bar' } %>"`; the port had to build an
`ActionView::Base` on the controller by hand (`renderInline` in
`packages/actionpack/src/action-controller/controller/log-subscriber.test.ts`) to
reach the fragment helpers. The TSE compiler already handles the arrow-block spelling
(`packages/tse-compiler/src/emit-js.ts`, `ARROW_BLOCK_RE`) and
`ActionView::TemplateRenderer` already handles `inline:`
(`packages/actionview/src/renderer/template-renderer.ts:40-42`) — the missing piece is
only the controller-side `render_to_body` override plus `_render_template`.

## Acceptance criteria

- `ActionView::Rendering#render_to_body` and `#_render_template`
  (`action_view/rendering.rb:118-127`) are ported and mixed into
  `ActionController::Base`, so `this.render({ inline: ... })` and
  `this.render({ template: ... })` produce a body.
- The `renderInline` helper in
  `packages/actionpack/src/action-controller/controller/log-subscriber.test.ts` is
  deleted and the six caching actions become `render inline:` calls in the trails
  TSE arrow-block spelling.
