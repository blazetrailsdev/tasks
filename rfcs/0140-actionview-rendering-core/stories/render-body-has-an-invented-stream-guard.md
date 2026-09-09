---
title: "Renderer#renderBody has an invented :stream guard and non-streaming fallback"
status: draft
updated: 2026-09-09
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Renderer#render_body`
(`vendor/rails/actionview/lib/action_view/renderer/renderer.rb:40-46`) has
exactly two arms:

```ruby
def render_body(context, options)
  if options.key?(:partial)
    [render_partial(context, options)]
  else
    StreamingTemplateRenderer.new(@lookup_context).render(context, options)
  end
end
```

`packages/actionview/src/renderer/renderer.ts`'s `renderBody` has three: the
partial arm, then an invented `if (options.stream)` guard around the streaming
renderer, then a non-streaming fallback that returns
`[(await this.renderTemplateToObject(context, options)).body]`. Rails streams
unconditionally on the non-partial arm — the `:stream` option is consumed by
`ActionController::Streaming`, not here.

Surfaced while porting the renderer bodies in PR #7643; the file is otherwise at
12/12 on `pnpm parity:api --package actionview`.

## Converged shape

`renderBody` mirrors Rails' two arms, with the `options.stream` branch and the
non-streaming fallback deleted, and whatever depends on the fallback moved to
the caller that actually owns the streaming decision.

## Acceptance criteria

- `renderBody`'s body matches `renderer.rb:40-46` — two arms, no `stream` guard.
- The non-partial arm goes through `StreamingTemplateRenderer` unconditionally.
- `pnpm parity:api:calls` loses the corresponding row rather than gaining any.
