---
title: "converge-cookies-middleware-onto-cookie-jar-write"
status: closed
updated: 2026-08-27
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Out of scope for this refine pass: entirely packages/actionpack (action-dispatch/middleware/cookies.ts, getSetCookieHeaders / NullCookieJar). RFC 0112's actionable surface here is activerecord + its workspace deps. Premise unchanged on origin/main; re-file under an actionpack RFC if that lane reopens."
---

## Context

`ActionDispatch::Cookies::CookieJar#write(response)`
(`vendor/rails/actionpack/lib/action_dispatch/middleware/cookies.rb:429-439`)
is the one seam that flushes a jar's accumulated set/delete sets, and the
`Cookies` middleware calls it (`cookies.rb:704-716`):

    response = Rack::Response[*response]
    cookie_jar.write(response)

trails ported `write` in the null-session convergence PR
(`packages/actionpack/src/action-dispatch/middleware/cookies.ts`), but the
middleware still flushes through the trails-only
`CookieJar#getSetCookieHeaders()`, which merges into the raw header tuple
rather than a `Rack::Response`. Two consequences:

- `getSetCookieHeaders` is extra surface with ~23 test call sites, and it
  carries no `write_cookie?` guard (`cookies.rb:448-450`), so a `secure`
  cookie is emitted over a plain-HTTP request where Rails would skip it.
- `NullCookieJar` (`request_forgery_protection.rb:289-293`) overrides only
  `write` in Rails; trails' subclass has to override `getSetCookieHeaders`
  too so the null jar actually swallows writes. That second override is the
  documented deviation this story retires.

## Acceptance criteria

- [ ] `ActionDispatch::Cookies#call` mirrors `cookies.rb:704-716`: wrap the
      app's tuple in a `Rack::Response` (`Response.create` is Ruby's
      `Rack::Response[*response]`), call `cookieJar.write(response)`, return
      `response.toArray()`.
- [ ] `getSetCookieHeaders` is gone, its test call sites reading the response
      headers instead.
- [ ] `NullCookieJar` overrides `write` only.
- [ ] The actionpack cookie/middleware suites stay green on the newline-joined
      vs array `set-cookie` shape (Rack's `add_header` accumulates an array).
