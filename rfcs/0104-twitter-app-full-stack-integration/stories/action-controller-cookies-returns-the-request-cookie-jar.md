---
title: "action-controller-cookies-returns-the-request-cookie-jar"
status: draft
updated: 2026-09-02
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

`ActionController::Base#cookies` returns the request's read-only cookie hash:

```ts
// packages/actionpack/src/action-controller/base.ts:987-989
get cookies(): Record<string, string> {
  return (this.request as any)?.cookies ?? {};
}
```

Rails' `ActionController::Cookies#cookies`
(`actionpack/lib/action_controller/metal/cookies.rb:16-18`) is
`request.cookie_jar` — the full `ActionDispatch::Cookies::CookieJar`, with
`signed`, `encrypted`, `permanent`, `delete` and write access. trails already
has that jar and its builder (`cookieJar` in
`packages/actionpack/src/action-dispatch/middleware/cookies.ts:622`), but it is
only reachable as a `this`-typed function called with `.call(request)`
(`metal/request-forgery-protection.ts:120`) — never from user-land controller
code.

Two consequences:

- `packages/actionpack/src/action-controller/metal/cookies.ts` holds a
  `getCookies(request)` helper that returns `request.cookies ?? {}` rather than
  the jar, so the ported module does not mirror `cookies.rb` at all.
- `trails generate authentication` cannot emit Rails' cookie-based session.
  PR for `authentication-generator-emits-comment-stubs` had to route the
  session id through the controller `session` hash instead of Rails'
  `cookies.signed.permanent[:session_id] = { value: session.id, httponly: true,
same_site: :lax }` (`authentication.rb.tt` `start_new_session_for`) and
  `cookies.signed[:session_id]` (`find_session_by_cookie`), with the divergence
  cited in the emitted template.

Also unported alongside it: `included do helper_method :cookies end`
(`cookies.rb:9-11`).

## Acceptance criteria

- `ActionController::Base#cookies` returns `request.cookie_jar`, as
  `cookies.rb:16-18` does, with `request.cookieJar()` reachable as a method on
  `ActionDispatch::Request` (Rails' `request.cookie_jar`,
  `middleware/cookies.rb`).
- `metal/cookies.ts` mirrors `cookies.rb` — the private `cookies` reader plus
  the `helper_method :cookies` in the `included` block.
- Existing `request.cookies` readers inside actionpack
  (`request-forgery-protection.ts:182-190`, `metal/live.ts:259`,
  `action-controller/test-case.ts:158`) keep working.
- The authentication generator's emitted `Authentication` concern is converged
  back to Rails' signed permanent cookie, and its divergence comment removed.
- An integration test generates the authentication files into a fresh app and
  exercises sign-up / log-in / log-out end to end.
