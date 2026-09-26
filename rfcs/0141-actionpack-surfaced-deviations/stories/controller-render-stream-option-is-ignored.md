---
title: "ActionController render(stream: true) is ignored — Streaming#_process_options unported"
status: draft
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `render stream: true` is handled by `ActionController::Streaming`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/streaming.rb`),
whose `_process_options` / `_render_template` route the template through
`view_renderer.render_body` and the StreamingTemplateRenderer.

trails' `packages/actionpack/src/action-controller/metal/streaming.ts` only
exports `isStreamingRequest` / `prepareStreamingHeaders`; nothing in
`ActionController::Base#render` / `renderAsync` (`action-controller/base.ts`)
reads a `stream:` option, and `RenderOptions` does not declare it. So
`LayoutSetInResponseTest#test_layout_set_when_using_streaming_layout`
(`vendor/rails/v8.0.2/actionview/test/actionpack/controller/layout_test.rb:170-174`,
`StreamingLayoutController` at `:101-106`) was left unported in trails#8152: it
would pass without streaming anything.

## Acceptance criteria

- `ActionController::Streaming#_process_options` / `_render_template` are
  ported and `render({ stream: true })` streams the template through the layout.
- `test_layout_set_when_using_streaming_layout` is ported into
  `packages/actionview/src/actionpack/controller/layout.test.ts`.
