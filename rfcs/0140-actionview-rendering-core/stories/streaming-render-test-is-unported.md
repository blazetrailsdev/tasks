---
title: "streaming_render_test.rb (FiberedTest) has no trails port"
status: ready
updated: 2026-09-27
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps:
  [
    "streaming-delayed-render-uses-a-sentinel-not-streaming-flow",
    "streaming-async-body-awaits-only-whole-expressions",
  ]
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

Rails' `vendor/rails/v8.0.2/actionview/test/template/streaming_render_test.rb` has no trails port.
It contains `FiberedTest` (`test_streaming_works`, `test_render_with_layout`,
`test_render_with_streaming_multiple_yields_provide_and_content_for`,
`test_render_with_streaming_with_fake_yields_and_streaming_buster`,
`test_render_with_nested_streaming_multiple_yields_provide_and_content_for`,
`test_render_with_streaming_and_capture`, …) and `FiberedWithLocaleTest`. They drive
`view_renderer.render_body` through `StreamingTemplateRenderer#delayed_render`
(`renderer/streaming_template_renderer.rb:56-104`) and `StreamingFlow` (`flows.rb:30-72`).
trails#8167 ported `StreamingFlow` and the async template body. At that point `delayedRender`
still used the sentinel, which story `streaming-delayed-render-uses-a-sentinel-not-streaming-flow`
replaces.

The Rails fixtures (`test/fixtures/layouts/{yield,streaming,streaming_with_capture,streaming_with_locale}.erb`,
`test/fixtures/test/{hello_world,streaming,streaming_buster,nested_streaming,streaming_with_locale}.erb`)
need TSE counterparts.

## Acceptance criteria

- `streaming_render_test.rb`'s tests are ported with their names verbatim, as a `.test.ts` beside
  the renderer, and pass through the real `renderBody` → `delayedRender` path.
- The locale case covers `delayed_render`'s `outer_config` carry (`streaming_template_renderer.rb:74-76`).
