---
title: "rack-logger-and-silence-request-take-logger-as-option"
status: draft
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
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

`Rails::Rack::Logger` (`vendor/rails/v8.0.2/railties/lib/rails/rack/logger.rb:15-18`)
is `initialize(app, taggers = nil)` and reads its logger from
`ActiveSupport::LogSubscriber#logger` (it subclasses `LogSubscriber`), i.e.
`Rails.logger`. `Rails::Rack::SilenceRequest`
(`vendor/rails/v8.0.2/railties/lib/rails/rack/silence_request.rb`) is
`initialize(app, path:)` and silences through `Rails.logger.silence`.

trails' `packages/trailties/src/rack/logger.ts` instead takes
`(app, { logger?, taggers? })` and defaults to a no-op logger, and
`packages/trailties/src/rack/silence-request.ts` takes
`(app, { path, logger? })` and passes through when no logger is given. So the
two entries `DefaultMiddlewareStack#buildStack`
(`packages/trailties/src/application/default-middleware-stack.ts`, mirroring
`default_middleware_stack.rb:57-61`) now mounts are inert in a generated app:
no "Started GET ..." line, no tags, no healthcheck silencing.

## Acceptance criteria

- [ ] `Logger`'s constructor is `(app, taggers = null)` and its `logger` is
      the `LogSubscriber` logger (`Trails.logger`), as in Rails; the
      `LoggerOptions` shape and `NOOP_LOGGER` are gone.
- [ ] `SilenceRequest`'s constructor is `(app, { path })` and it silences via
      `TopLevel.Trails.logger.silence`.
- [ ] `buildStack` passes `config.logTags` positionally to `Logger`.
- [ ] `logger.test.ts` / `silence-request.test.ts` are converged to the Rails
      tests (`railties/test/rack_logger_test.rb`,
      `railties/test/rack/silence_request_test.rb` if present).
