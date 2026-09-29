---
title: "Authentication generator hand-builds /session/new instead of new_session_path"
status: draft
updated: 2026-09-29
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' authentication generator templates redirect through route helpers:
`redirect_to new_session_path` (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/authentication/templates/app/controllers/concerns/authentication.rb.tt`,
`request_authentication`), `redirect_to new_session_path, alert: "Try again later."`
(`sessions_controller.rb.tt`, `rate_limit`), and `redirect_to new_session_path`
(`sessions_controller.rb.tt#destroy`, `passwords_controller.rb.tt`).

trails' `packages/trailties/src/generators/rails/authentication/templates.ts` hand-builds
`this.redirectTo("/session/new", …)` at about six sites. trails#8253 converged the
scaffold controller onto the NamedBase / route-helper spelling
(`this.redirectTo(this.postsPath(), …)`). The authentication templates are the
remaining hand-built paths.

## Converged shape

Every redirect in the emitted authentication controllers and concern calls the
route helper Rails names: `this.newSessionPath()`, and `this.editPasswordPath(token)`
where Rails uses `edit_password_path`.

## Acceptance criteria

- No string-literal path remains in `this.redirectTo(...)` in the authentication templates.
- `authentication_generator_test.rb`'s `redirect_to new_session_path` assertions are ported.
