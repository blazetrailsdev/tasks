---
title: "wire-template-spot-to-exception-wrapper"
status: claimed
updated: 2026-09-03
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 10
pr: null
claim: "2026-09-03T18:59:40Z"
assignee: "lookup-context-render-takes-rails-prefixes-and-formats"
blocked-by: null
closed-reason: null
---

## Context

`Template#translateLocation` was ported in #7349
(`packages/actionview/src/template.ts`) per
`vendor/rails/actionview/lib/action_view/template.rb:250-256`, and the `Tse`
handler's `translateLocation` hook
(`packages/actionview/src/template/handlers/tse.ts:109`) is now reachable
through it. Nothing calls it.

Rails' one caller is ActionDispatch's exception wrapper:

```ruby
# vendor/rails/actionpack/lib/action_dispatch/middleware/exception_wrapper.rb:239-248
def spot(...)
  location = @template.spot(__getobj__)
  ...
  @template.translate_location(__getobj__, location)
end
```

which is fed by `Template#spot` (`template.rb:231-246`) — itself unported,
because it walks `RubyVM::AbstractSyntaxTree` / Prism to find the node id for
a backtrace location and hands the node to `ErrorHighlight.spot`. Neither
`spot` nor an ErrorHighlight analogue exists in trails
(`grep -rn "spot" packages/actionview/src packages/actionpack/src` finds only
the tse handler's own `Spot` type), so an error raised inside a `.tse`
template still reports a position in the emitted JS rather than in the
template source — the user-visible symptom the ported machinery exists to fix.

## Converged shape

Port trails' analogue of the ErrorHighlight integration, in Rails' own
decomposition: `Template#spot(location)` first (V8 gives a `CallSite` with
line/column where Ruby gives a node id, so the node search is replaced by the
frame trails already has), then `ExceptionWrapper`'s `spot` calling
`spot` and `translateLocation` in that order. Do NOT invent a call site
elsewhere — the whole point of `translate_location` is that it sits between a
raw backtrace location and a rendered snippet.

## Acceptance criteria

- `Template#spot` exists, or its absence is recorded with a permanence
  receipt naming what V8 cannot supply.
- `translateLocation` has its Rails caller.
- A `.tse` template that raises reports a line inside the template.
