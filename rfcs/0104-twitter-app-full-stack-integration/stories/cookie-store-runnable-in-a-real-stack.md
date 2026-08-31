---
title: "cookie-store-runnable-in-a-real-stack"
status: draft
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
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
2. **There is no example app to convert.** RFC 0104's stories describe an
   `examples/twitter-app` that hand-rolls a cookie session behind a `TODO`
   pointing at `session-and-flash-lifecycle`. That app exists only on the
   unmerged branch it was authored on — `c2c2aa280` ("feat(examples): add
   twitter-app, the first full-stack trails application") is NOT an ancestor of
   `origin/main`. What main ships is `examples/twitter-clone`, an older
   models-only example with no controllers, views, cookies or session (zero
   grep hits for `cookie` / `session`). So the example-app acceptance criterion
   this story inherited cannot be met until that app lands.

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
- If (and only if) `examples/twitter-app` has landed on main by then, it drops
  its hand-rolled cookie session in favour of `session[...]` and its `TODO`
  referencing `session-and-flash-lifecycle` is removed. It is not on main
  today, so this criterion is vacuous until that changes — do not convert
  `examples/twitter-clone`, which has no session code to convert.
