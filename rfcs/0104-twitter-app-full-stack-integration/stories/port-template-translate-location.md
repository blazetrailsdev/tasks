---
title: "Template#translate_location is unported, so the ported .tse location machinery has no caller"
status: draft
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Template#translate_location`
(`vendor/rails/actionview/lib/action_view/template.rb:250-256`) is not ported:

```ruby
def translate_location(backtrace_location, spot)
  if handler.respond_to?(:translate_location)
    handler.translate_location(spot, backtrace_location, encode!) || spot
  else
    spot
  end
end
```

It is the only caller of the handler-side hook in Rails
(`grep -rn translate_location vendor/rails/actionview/lib/` finds `template.rb:251-253`
and the `Handlers::ERB#translate_location` definition, and nothing else).

trails has the handler half — `Tse#translateLocation`
(`packages/actionview/src/template/handlers/tse.ts`) delegating to
`tse-translate-location.ts`, which ports `find_offset` / `offset_source_tokens`
from `erb.rb` — and `packages/actionview/src/template.ts` has no
`translateLocation`. So the ported machinery has no caller and an error raised
inside a `.tse` template reports a position in the emitted JS rather than in the
template source.

Surfaced in review of PR #7281, which asked whether `Tse#render` should call
`translateLocation` on failure. It should not: Rails' rescue is
`Template#render`'s `handle_render_error` (`template.rb:271`, `:549-556`) —
already ported at `packages/actionview/src/template.ts:143-155` — and
`Handlers::ERB#call` carries no rescue at all. The missing piece is the
`Template` wrapper, and its caller.

## Converged shape

Port `Template#translateLocation(backtraceLocation, spot)` per
`template.rb:250-256`, including the `respond_to?` arm (a handler without the
hook returns `spot` unchanged) and the `|| spot` fallback when the handler
cannot anchor the snippet. Then wire it to whatever consumes a spot — Rails'
caller is the ErrorHighlight integration, so identify trails' analogue rather
than inventing one; if there is none yet, that is a second story, not an
invented call site here.

## Acceptance criteria

- `Template#translateLocation` matches `template.rb:250-256` branch for branch.
- A handler with no `translateLocation` returns the spot unchanged.
- A handler that returns `null` falls back to the spot.
- The `Tse` handler's existing hook is reached through it.
