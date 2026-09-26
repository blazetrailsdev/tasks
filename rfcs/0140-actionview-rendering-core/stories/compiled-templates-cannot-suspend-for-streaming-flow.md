---
title: "Compiled templates render synchronously, so StreamingFlow cannot suspend the layout at yield"
status: draft
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`StreamingTemplateRenderer#delayed_render`
(`vendor/rails/v8.0.2/actionview/lib/action_view/renderer/streaming_template_renderer.rb:56-104`)
runs the layout inside a `Fiber`. `StreamingFlow#get` (`actionview/lib/action_view/flows.rb:43-58`)
`Fiber.yield`s when the layout asks for content the template has not produced yet, and
`StreamingFlow#append!` (`flows.rb:63-66`) resumes it mid-template.

trails cannot express that. Compiled TSE templates are synchronous:
`Template#render` → `Base#_run` → `compiled.call(...)` returns a string
(`packages/actionview/src/template.ts` `render`, `packages/actionview/src/base.ts` `_run`).
ruby-compat's `Fiber` (`packages/ruby-compat/src/fiber.ts`) has no `Fiber.yield`, and a
synchronous body cannot suspend. This blocks
`streaming-delayed-render-uses-a-sentinel-not-streaming-flow` (trails#8156 blocked it on
exactly this).

## Converged shape

The template compiler emits an `async` method body when the handler supports streaming.
`Base#_run` can then await it, and `StreamingFlow#get` returns a promise the layout awaits
at `yield`. That is JS's stand-in for `Fiber.yield`. `delayedRender` then drives
the layout exactly as `streaming_template_renderer.rb:56-104` does.

## Acceptance criteria

- A streaming-capable compiled template can await inside `yield` / `content_for` reads.
- `StreamingFlow` is ported in `flows.ts` with `get` / `append!` suspending and resuming
  the layout the way `flows.rb:43-66` does.
- `streaming-delayed-render-uses-a-sentinel-not-streaming-flow` is unblocked.
