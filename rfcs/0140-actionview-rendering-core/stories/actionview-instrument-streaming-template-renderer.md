---
title: "actionview-instrument-streaming-template-renderer"
status: closed
updated: 2026-09-09
rfc: "0140-actionview-rendering-core"
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
closed-reason: "converged in #7649 — delayedRender now spans the render with Notifications.buildHandle"
---

## Context

`StreamingTemplateRenderer#delayed_render`
(`vendor/rails/actionview/lib/action_view/renderer/streaming_template_renderer.rb:56-83`)
wraps its whole body in

```ruby
ActiveSupport::Notifications.instrument(
  "render_template.action_view",
  identifier: template.identifier,
  layout: layout && layout.virtual_path,
  locals: locals
) do
  ...
end
```

`packages/actionview/src/renderer/streaming-template-renderer.ts`'s
`delayedRender` is an `async *` generator that splits the layout at a sentinel,
and carries no instrumentation. A synchronous `Notifications.instrument` block
cannot span an async generator, so the omission was baselined in
`scripts/api-compare/call-mismatches-exclude/actionview/renderer/streaming-template-renderer.json`
(`rubyName: delayed_render`, `call: instrument`) when
`actionview-instrumentation` made `Template#instrument` a matched name and
surfaced the row.

## Acceptance criteria

- `delayedRender` publishes `render_template.action_view` with Rails' payload
  (`identifier`, `layout`, `locals`) spanning the whole streamed render —
  through `Notifications.instrument`'s async-aware path or an explicit
  start/finish handle, whichever the repo already has.
- The `call: "instrument"` baseline row above is deleted, and any resulting
  stale high-water mark tightened with `pnpm parity:api:calls:tighten`.
