---
title: "Journey::Route#matches' else arm is case equality, not identity"
status: in-progress
updated: 2026-09-26
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8154
claim: "2026-09-26T17:42:02Z"
assignee: "journey-route-matches-else-arm-is-case-equality"
blocked-by: null
closed-reason: null
---

## Context

`Journey::Route#matches?`'s fall-through arm is case equality
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/journey/route.rb:161-162`):

```ruby
else
  value === request.send(method)
```

so a `Range`, `Class`, `Proc` or `Set` constraint value matches by its own
`===` (`(1..5) === 3`, `Integer === 3`, a proc is called).

trails' `Route#matches` (`packages/actionpack/src/action-dispatch/journey/route.ts`)
ports the arm as `value !== rbFSend(request, method)`, i.e. identity, so any
such constraint never matches. Surfaced while converging the `send` half in trails#8133.

## Converged shape

The else arm dispatches Ruby `===` on the value: `RegExp` test, `Range#cover?`-style
`rbRange` `===`, class `instanceof`, function call, falling back to `rbEqual`.
If ruby-compat gains a general `rb_funcall(value, "===", x)` port, use it here
and in the `when Regexp, String` arm.

## Acceptance criteria

- A route with `constraints: { port: new Range(3000, 3010) }`-style value matches a request on port 3005.
- The else arm routes through a Ruby case-equality port, not `!==`.
