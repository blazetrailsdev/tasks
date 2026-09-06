---
title: "Port ActionDispatch::Cookies#call onto Rack::Response so set-cookie is a Rack 3 array"
status: claimed
updated: 2026-09-06
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: 27
pr: null
claim: "2026-09-06T17:39:33Z"
assignee: "converge-actiondispatch-cookies-middleware-onto-rack-response"
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Cookies#call`
(`vendor/rails/actionpack/lib/action_dispatch/middleware/cookies.rb:704-717`) is
five lines:

```ruby
def call(env)
  request = ActionDispatch::Request.new(env)
  response = @app.call(env)

  if request.have_cookie_jar?
    cookie_jar = request.cookie_jar
    unless cookie_jar.committed?
      response = Rack::Response[*response]
      cookie_jar.write(response)
    end
  end

  response.to_a
end
```

trails' `packages/actionpack/src/action-dispatch/middleware/cookies.ts:447-468`
is not a port of it. It never builds a `Rack::Response`, never calls
`cookie_jar.write(response)`, and instead hand-rolls a header merge: it copies
the header hash, walks every key case-insensitively looking for `set-cookie`,
flattens whatever it finds, and re-joins the result with `"\n"`.

That `"\n"` join is a Rack 2 shape. Under Rack 3 — which trails targets, and
which `RackResponse`'s header type now admits after #7529 widened it to
`Record<string, string | string[]>` — `set-cookie` is an ARRAY. `Rack::Response`
handles this itself via `add_header`
(`vendor/rack/lib/rack/response.rb`), which is exactly the call the rewrite
skips. So the middleware emits a newline-joined string where Rack 3 wants a
list, and every consumer downstream has to cope with both.

Surfaced while widening `RackResponse`'s header member
(`widen-rack-response-header-type-to-allow-arrays`, PR #7529): the widening made
the array arm representable, and `outHeaders` had to be widened to
`Record<string, string | string[]>` to typecheck — but the `"\n"` join underneath
was left alone, because converging it is a middleware rewrite rather than a type
change.

## Converged shape

Port `call` as Rails writes it: construct the response, hand it to
`cookie_jar.write`, and return `to_a`. The set-cookie accumulation belongs in
`Rack::Response#add_header` / `CookieJar#write`
(`cookies.rb`'s `def write(headers)`), not in the middleware.

## Acceptance criteria

- [ ] `Cookies#call` mirrors `cookies.rb:704-717` line for line: the
      `have_cookie_jar?` guard, the `committed?` guard, `Rack::Response[*response]`,
      `cookie_jar.write(response)`, `response.to_a`.
- [ ] The hand-rolled case-insensitive header walk and the `"\n"` join are gone.
- [ ] `set-cookie` is emitted as an array under Rack 3, matching
      `Rack::Response`'s own behaviour.
- [ ] `cookies.test.ts`'s assertions are updated to read the array rather than
      splitting on `"\n"` (they currently wrap the read in `String(...)`), and no
      test name is reworded.
- [ ] `pnpm parity:api` / `parity:test` deltas non-negative; both call gates green.
