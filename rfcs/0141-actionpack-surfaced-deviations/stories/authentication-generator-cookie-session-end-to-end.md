---
title: "authentication-generator-cookie-session-end-to-end"
status: claimed
updated: 2026-09-27
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-09-27T23:57:35Z"
assignee: "abstract-normalize-render-self-dispatches-process-variant"
blocked-by: null
closed-reason: null
---

## Context

Split out of `action-controller-cookies-returns-the-request-cookie-jar` to keep
that PR under the LOC ceiling. That story converged
`ActionController::Cookies#cookies` onto `request.cookie_jar`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/cookies.rb:16-18`,
trails `packages/actionpack/src/action-controller/metal/cookies.ts`) and pointed
the generated `Authentication` concern
(`packages/trailties/src/generators/rails/authentication/templates.ts`,
`findSessionByCookie` / `startNewSessionFor` / `terminateSession`) at
`this.cookies().signed.get("session_id")`,
`this.cookies().signed.permanent.set("session_id", { value, httpOnly, sameSite })`
and `this.cookies().delete("session_id")`, mirroring Rails'
`railties/lib/rails/generators/rails/authentication/templates/app/controllers/concerns/authentication.rb.tt`.

What is still unproven is that the emitted concern actually round-trips a
signed permanent cookie through a real request cycle: the generator tests only
snapshot the emitted text and run `tsc --strict` over it.

Two gaps to check while wiring it:

- The generated ActionCable connection template (same `templates.ts`,
  `app/channels/application_cable/connection.rb`) still spells
  `this.cookies.signed["session_id"]` against a hand-declared
  `cookies: { signed: Record<string, string> }`; Rails' is
  `cookies.signed[:session_id]` against `ActionCable::Connection::Base#cookies`.
- `ActionController::Live::Response#before_committed`
  (`action_controller/metal/live.rb:262-267`) writes `request.cookie_jar` onto
  the response; trails' `packages/actionpack/src/action-controller/metal/live.ts`
  `beforeCommitted` hand-builds a `set-cookie` header from `this.cookies`
  instead.

## Acceptance criteria

- An integration test generates the authentication files into a fresh app
  (`trails new` fixture) and exercises sign-up / log-in / log-out end to end:
  log-in sets a signed permanent `session_id` cookie, a follow-up request
  resumes the session from it, log-out deletes it.
- `Live::Response#beforeCommitted` calls `request.cookieJar().write(this)`
  unless committed, as `live.rb:262-267` does.
