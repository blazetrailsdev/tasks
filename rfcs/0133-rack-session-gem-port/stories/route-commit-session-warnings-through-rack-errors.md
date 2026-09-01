---
title: "Route commit_session's two diagnostics through rack.errors instead of console"
status: draft
updated: 2026-09-01
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Persisted#commit_session` writes two diagnostics to the Rack error stream:

```ruby
req.get_header(RACK_ERRORS).puts("Warning! #{self.class.name} failed to save session. Content dropped.")
...
req.get_header(RACK_ERRORS).puts("Deferring cookie for #{session_id}") if $VERBOSE
```

(`vendor/rack-session/lib/rack/session/abstract/id.rb:396-400`.)

`packages/rack-session/src/abstract/id.ts` (`commitSession`, the `if (!isTruthy(data))`
/ `else if (... defer ...)` arms) diverges on both: the first goes to
`console.warn` instead of the request's `rack.errors` stream, and the second is
an empty branch carrying an eslint `no-empty` suppression, because trails' Rack
env carries no `rack.errors` writer.

Verified while porting `Rack::Session::Pool` in PR #7346; nothing in the port
depends on the divergence, so it is safe to converge on its own.

## Converged shape

`RACK_ERRORS` reaches the store the same way `RACK_SESSION` does — off the
request header — so the converged body is `req.getHeader(RACK_ERRORS).puts(...)`
against a stream object on the env, matching the two Ruby lines including the
`self.class.name` interpolation. That needs a `rack.errors` writer in
`@blazetrails/rack`'s env (Rack's own default is `$stderr`), which is the bulk
of the work; the `$VERBOSE` guard on the second line has no trails analogue and
should be decided explicitly rather than left as an empty branch.

## Acceptance criteria

- Both `puts` call sites in `commitSession` write through the request's
  `rack.errors` header, not `console`.
- The `defer` branch is no longer empty and no longer carries an eslint
  `no-empty` suppression.
- `parity:api:calls` gains no rows for `abstract/id.ts`; existing rows for
  `commit_session` shrink or stay.
