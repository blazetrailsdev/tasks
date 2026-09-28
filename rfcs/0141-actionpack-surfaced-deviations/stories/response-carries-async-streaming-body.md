---
title: "response-carries-async-streaming-body"
status: draft
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
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

trails#8209 ported `ActionController::Streaming#_render_template`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/streaming.rb`),
so `render(stream: true)` now returns
`view_renderer.render_body(view_context, options)`, an
`ActionView::StreamingTemplateRenderer::Body`
(`packages/actionview/src/renderer/streaming-template-renderer.ts`).

Rails hands that Body straight to the response:
`ActionController::Metal#response_body=`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal.rb:234-242`)
does `response.body = body`, and the Rack server calls `body.each` while it
writes the socket, so each chunk goes out as the layout and template yield it.

trails cannot do that yet. `ActionDispatch::Response`
(`packages/actionpack/src/action-dispatch/http/response.ts`) keeps a
synchronous body. `Response#each`, `RackBody#each` and the `Buffer` it wraps
are sync generators, and `RackBody[Symbol.asyncIterator]` just walks them.
The streamed `Body#each` is async, because the Fiber-driven
`delayedRender` awaits template rendering. So
`ActionController::Base#renderToBody` (`packages/actionpack/src/action-controller/base.ts`)
drains the Body into an array, through `drainStreamingBody`, before
`AbstractController::Rendering#render` assigns `responseBody`
(trails#8212 collapsed the former `renderAsync` into `render`). The page is
rendered through the streaming renderer, but it is sent in one piece.

## Acceptance criteria

- `ActionDispatch::Response` accepts a body whose `each` is async and
  passes it through `RackBody`'s async iterator chunk by chunk.
- `render` assigns the streamed Body as `metal.rb:234-242` does, with
  no drain: `drainStreamingBody` and its `@noRailsEquivalent CONVERGEABLE`
  receipt pointing at this story are removed.
- A test shows the first chunk (the layout head, before `yield`) reaching
  the rack body before the template body has finished rendering.
