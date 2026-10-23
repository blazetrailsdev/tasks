---
title: "Development server answers static 500 for InvalidAuthenticityToken and routing errors"
status: done
updated: 2026-10-23
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionpack", "trailties"]
deps: []
deps-rfc: []
est-loc: 150
priority: 1
pr: trails#9279
claim: "2026-10-23T18:45:53Z"
assignee: "dev-server-exception-pages-answer-static-500"
blocked-by: null
closed-reason: null
---

## Context

Found re-running the root README quickstart on `main` `9a59b3b073` (trails#8195), Node 24.16.0, SQLite. On `b8bcadc150` (2026-10-14) both cases below behaved as Rails does.

In a fresh `trails new` app, `bin/trails server` in development (`config/environments/development.ts` sets `considerAllRequestsLocal = true`):

- `POST /posts` with no `authenticity_token` (or `authenticity_token=bad`) answers `500` with `public/500.html`. Rails answers `422` for `ActionController::InvalidAuthenticityToken` (`actionpack/lib/action_dispatch/middleware/exception_wrapper.rb` `rescue_responses`, `"ActionController::InvalidAuthenticityToken" => :unprocessable_entity`) and, with `consider_all_requests_local`, renders the `DebugExceptions` page (`actionpack/lib/action_dispatch/middleware/debug_exceptions.rb`).
- `GET /nope` (no route) also answers `500` with the static page, where Rails' `DebugExceptions` renders the routing-error 404 page.

Nothing is printed to the server's stdout/stderr and no `log/development.log` is written, so the swallowed exception is not visible. Valid-token create/update/destroy work (302/303 with notices), so the failure is in the exception path (`DebugExceptions` / `ShowExceptions` / `PublicExceptions`, or the exceptions-app wiring in trailties), not in CSRF itself.

## Acceptance criteria

- In a generated app in development, a POST without a valid token answers `422` with the debug page naming `ActionController::InvalidAuthenticityToken`, and an unknown route answers `404` with the routing-error debug page.
- The exception that currently produces the 500 is logged, as Rails logs it through `DebugExceptions#log_error`.
- A regression test (integration through the app's middleware stack) fails on `9a59b3b073` and passes after the fix.
