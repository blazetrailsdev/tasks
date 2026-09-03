---
title: "cookie-store-runnable-in-a-real-stack"
status: ready
updated: 2026-09-03
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 11
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`session-and-flash-lifecycle` ported `Rack::Session::Abstract::Persisted#call`
/ `#context` / `#commit_session` and friends
(`vendor/rack-session/lib/rack/session/abstract/id.rb:239-497`) into
`packages/actionpack/src/action-dispatch/middleware/session/abstract-store.ts`,
plus `Rack::Session::Pool` (`pool.rb`) at
`.../middleware/session/pool.ts`, so a store IS now usable as middleware.
Two pieces of that story's acceptance did not fit the PR:

1. **`CookieStore` still cannot run in a real stack.** Its `cookieJar(request)`
   reads `request.cookieJar.signedOrEncrypted`
   (`middleware/session/cookie-store.ts`), but `ActionDispatch::Request` has no
   `cookieJar` member — `cookieJar` exists only as a free function at
   `middleware/cookies.ts:621` and is re-exported from
   `action-dispatch/deprecator.ts:36`. Rails prepends
   `ActionDispatch::RequestCookieMethods` onto Request
   (`middleware/cookies.rb`), which is what makes `request.cookie_jar` answer.
2. **There is no example app to convert.** The full-stack example RFC 0104's
   older story bodies were written against never landed on `origin/main`.
   What main ships is `examples/twitter-clone`, a models-only example with no
   controllers, views, cookies or session (zero grep hits for `cookie` /
   `session`), so the example-app acceptance criterion this story inherited
   has nothing to act on and has been dropped.

Note `DefaultMiddlewareStack#buildStack`
(`packages/trailties/src/application/default-middleware-stack.ts`) only uses
`config.sessionStore` when truthy, and nothing sets it — see
`port-remaining-finisher-initializers` for `setup_default_session_store`
(`railties/lib/rails/application/finisher.rb:49-54`).

## Acceptance criteria

- `ActionDispatch::RequestCookieMethods` is mixed onto `Request` so
  `request.cookieJar` answers, per `middleware/cookies.rb`.
- `CookieStore` runs as middleware end to end: a request through a stack
  carrying it round-trips `session[...]` across two requests via the cookie.
- No example-app conversion: `examples/twitter-clone` has no session code to
  convert, and no other example app exists on main.
