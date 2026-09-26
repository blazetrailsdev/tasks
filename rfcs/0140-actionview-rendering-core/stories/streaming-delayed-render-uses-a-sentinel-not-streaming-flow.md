---
title: "StreamingTemplateRenderer#delayed_render splits on a sentinel instead of driving StreamingFlow"
status: draft
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `StreamingTemplateRenderer#delayed_render`
(`vendor/rails/v8.0.2/actionview/lib/action_view/renderer/streaming_template_renderer.rb:56-104`)
works like this:

- It wraps the Rack buffer in `ActionView::StreamingBuffer`.
- It renders the layout inside a `Fiber` whose view flow is `StreamingFlow` (`flows.rb:30`).
- It resumes the fiber until the layout asks for the template, renders the template, then resumes until the layout finishes.
- It also carries `I18n.config` into the fiber (`outer_config`).

trails' `delayedRender` (`packages/actionview/src/renderer/streaming-template-renderer.ts`)
does something else:

- It renders the whole layout up front with a `_layoutFor` that returns a random `\x00STREAM_YIELD_…` sentinel, then splits the layout string on that sentinel.
- There is no `StreamingBuffer` and no `StreamingFlow` (`flows.rb` has no `StreamingFlow` port).
- A layout that yields a named `content_for` block, or yields more than once, is not streamed the way Rails streams it.
- The sentinel can collide with template output.

trails#8135 converged `Body`, the `render_template` override and the `delayed_render(buffer, template, layout, view, locals)` signature. It left the body alone.

## Converged shape

- Port `StreamingFlow` in `flows.ts` and `StreamingBuffer` in `buffers.ts`.
- `delayedRender` writes through the buffer and drives the layout through an async continuation. This is JS's stand-in for the `Fiber`: the layout awaits the template's content when it calls `yield`.
- The sentinel string is deleted.

## Acceptance criteria

- `delayedRender` has no sentinel string. The layout's `yield` reaches the template through `StreamingFlow#get`.
- `StreamingFlow` and `StreamingBuffer` exist at their Rails files.
- The `delayed_render new` / `set` baseline rows in `call-mismatches-exclude/actionview/renderer/streaming-template-renderer.json` converge.
