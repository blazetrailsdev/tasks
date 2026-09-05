---
title: "DebugExceptions#call drops the X-Cascade == pass arm that raises RoutingError"
status: draft
updated: 2026-09-05
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
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

Surfaced in PR #7518 while sweeping `JSON.stringify` stand-ins for Ruby's
`inspect`. The PR's description originally claimed `debug_exceptions.rb:35`'s
`.inspect` was converted; a reviewer established it could not have been,
because the branch that raises it is not ported at all.

Rails
(`vendor/rails/actionpack/lib/action_dispatch/middleware/debug_exceptions.rb:30-40`),
in `DebugExceptions#call`:

```ruby
def call(env)
  request = ActionDispatch::Request.new env
  _, headers, body = response = @app.call(env)

  if headers["X-Cascade"] == "pass"
    body.close if body.respond_to?(:close)
    raise ActionController::RoutingError, "No route matches [#{env['REQUEST_METHOD']}] #{env['PATH_INFO'].inspect}"
  end

  response
rescue Exception => exception
  ...
end
```

`packages/actionpack/src/action-dispatch/middleware/debug-exceptions.ts` has no
counterpart to the `X-Cascade` arm: it calls the app and rescues, but never
inspects the response headers, so a downstream `X-Cascade: pass` (what
`ActionDispatch::Routing::RouteSet` returns when nothing matched) flows through
as an ordinary response instead of becoming a `RoutingError` that the debug
page renders.

That is also the only place in Rails that produces the
`"No route matches [METHOD] path"` message. trails' `RouteSet#recognizePath`
had borrowed that text; PR #7518 converged it to `route_set.rb:952`'s
`"No route matches #{path.inspect}"`, so the bracketed form now has no home in
the port at all.

## Converged shape

Port the `X-Cascade` arm at the top of `DebugExceptions#call`, before the
rescue: read the header off the response the app returned, close the body if it
responds to `close`, and raise `RoutingError` with
`"No route matches [#{method}] #{rbInspect(pathInfo)}"` — `rbInspect` from
`@blazetrails/ruby-compat`, not `JSON.stringify`, per the same sweep.

Note that trails' response tuple and `body.close` shape differ from Rack's; the
`respond_to?(:close)` guard ports as a `typeof body.close === "function"` test
rather than being dropped.

## Acceptance criteria

- [ ] `debug-exceptions.ts`'s `call` has the `X-Cascade == "pass"` arm of
      `debug_exceptions.rb:34-37`, in the same position, before the rescue.
- [ ] The raise uses `rbInspect`, matching the sweep in #7518.
- [ ] A test covers a downstream app answering `X-Cascade: pass` and asserts
      the debug page renders the routing error, mirroring Rails'
      `actionpack/test/dispatch/debug_exceptions_test.rb`'s pass-through case.
- [ ] `pnpm parity:api:calls` does not regress.
