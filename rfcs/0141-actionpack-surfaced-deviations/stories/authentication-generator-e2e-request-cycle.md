---
title: "authentication-generator-e2e-request-cycle"
status: draft
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
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

Split out of `authentication-generator-cookie-session-end-to-end`, whose
`Live::Response#before_committed` half shipped (it now writes
`request.cookie_jar` onto the response, `action_controller/metal/live.rb:262-267`).
The remaining half needs a harness trails does not have yet: no test boots a
_freshly generated_ app. `packages/trailties/src/generators/app-generator.test.ts`
only inspects emitted files, and the boot tests
(`packages/trailties/src/boot-app-*.trails.test.ts`,
`application.test.ts` "Trails.application integration (boot-app fixture)")
use the hand-written `__fixtures__/boot-app`.

The generated `Authentication` concern
(`packages/trailties/src/generators/rails/authentication/templates.ts`,
`findSessionByCookie` / `startNewSessionFor` / `terminateSession`, mirroring
`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/authentication/templates/app/controllers/concerns/authentication.rb.tt`)
is only covered by a text snapshot and a `tsc --strict` pass
(`authentication-generator.trails.test.ts`).

Pieces the harness needs, each unproven today: the generated migrations
(`addMigrations`, `CreateUsers` / `CreateSessions`) run against the app's
sqlite database; `has_secure_password` with `bcryptjs`; `User.authenticate_by`;
`rate_limit`'s cache store; a session store for `return_to_after_authenticating`;
`Current` reset between requests (the executor); and a signed permanent cookie
carried from one request's `set-cookie` to the next request's `HTTP_COOKIE`
through `action_dispatch.key_generator`.

Also still open from the parent story: the generated ActionCable connection
template (same `templates.ts`, `app/channels/application_cable/connection.rb`)
spells `this.cookies.signed["session_id"]` against a hand-declared
`cookies: { signed: Record<string, string> }`; Rails' is
`cookies.signed[:session_id]` against `ActionCable::Connection::Base#cookies`.

## Acceptance criteria

- An integration test generates the authentication files into a fresh app
  (`trails new` fixture), runs its migrations, boots it, and exercises
  sign-in / sign-out end to end: `POST /session` sets a signed permanent
  `session_id` cookie, a follow-up request carrying it resumes the session,
  `DELETE /session` deletes it.
- The ActionCable connection template reads `cookies.signed.get("session_id")`
  off the connection's real cookie jar, not a hand-declared record.
