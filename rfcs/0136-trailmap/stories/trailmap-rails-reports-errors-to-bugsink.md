---
title: "trailmap-rails reports errors to Bugsink (sentry-rails twin of the error-reporting initializer)"
status: draft
updated: 2026-11-26
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#204 made the Trails app report errors to Bugsink. `config/initializers/error-reporting.ts` starts `@sentry/node` when `SENTRY_DSN` is set and subscribes to `Trails.error`. `app/controllers/api-controller.ts` `_renderServerError` reports rescued 500s as `handled: true, severity: "error", source: "api"`.

The Rails twin got only the report call: `rails/app/controllers/api_controller.rb` `render_server_error` calls `Rails.error.report(error, handled: true, severity: :error, source: "api")`. Nothing subscribes to `Rails.error` there, so that call reports nowhere. The `trailmap-rails` dokku app has no `SENTRY_DSN`, and Bugsink has no project for it.

## Shape expected

- `sentry-rails` in `rails/Gemfile`, plus `rails/config/initializers/sentry.rb`, which runs only when `SENTRY_DSN` is set. sentry-rails subscribes to `Rails.error` itself.
- A Bugsink project `trailmap-rails` in team `fleet`. Its DSN host is rewritten to `bugsink.web:8000`, as `docs/deploy.md` "Error reporting" describes.
- `trailmap-rails` attached to the dokku `fleet` network, if it isn't already.

## Acceptance criteria

- A rescued API 500 in trailmap-rails shows up in Bugsink at level error, once.
- With `SENTRY_DSN` unset (tests, development), nothing is sent.
