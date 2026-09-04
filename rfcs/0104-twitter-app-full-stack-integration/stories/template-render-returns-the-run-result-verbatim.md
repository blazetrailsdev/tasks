---
title: "Template#render returns _run's result verbatim and nil for the buffer arm"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Template#render` (`vendor/rails/actionview/lib/action_view/template.rb:279-286`)
returns two different things depending on the `buffer` argument:

```ruby
if buffer
  view._run(method_name, self, locals, buffer, ...)
  nil
else
  result = view._run(method_name, self, locals, OutputBuffer.new, ...)
  result.is_a?(OutputBuffer) ? result.to_s : result
end
```

`packages/actionview/src/template.ts` (`render`) returns `""` for the buffer
arm where Rails returns `nil`, and `String(result ?? "")` for the non-buffer
arm where Rails returns `result` verbatim — so a compiled method returning a
non-buffer value is stringified rather than passed through.

The divergence is currently invisible: the tse-compiled method always returns
its `OutputBuffer`, so the `instanceof` arm always wins, and no trails caller
passes a `buffer`. It was left in place because `string | null` cascades
through `RenderableTemplate.render` and five renderer call sites
(`packages/actionview/src/renderer/{template,partial,object,collection,streaming-template}-renderer.ts`),
which is a wider diff than the PR that surfaced it could carry.

## Converged shape

`Template#render` returns `string | null`: `null` on the buffer arm, and the
`_run` result verbatim on the other. `RenderableTemplate.render` widens to
match and the renderer call sites coalesce at the point they build
`RenderedTemplate`, which is where trails actually needs a string.

## Acceptance criteria

- `Template#render`'s buffer arm returns `null`, per `template.rb:281`.
- The non-buffer arm returns `result` unchanged when it is not an
  `OutputBuffer`, per `template.rb:284`.
- The five renderer call sites handle the `null`/non-string arms rather than
  `Template#render` coercing on their behalf.
