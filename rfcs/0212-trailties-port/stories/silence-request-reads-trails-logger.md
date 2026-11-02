---
title: "SilenceRequest reads Trails.logger"
status: ready
updated: 2026-11-02
rfc: "0212-trailties-port"
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

`packages/trailties/src/rack/silence-request.ts` takes its logger from `options.logger`, prefers an invented
`silenceAsync`, and throws an invented Error when `silence` does not run its callback. Rails' middleware
calls `Rails.logger.silence { @app.call(env) }` (`vendor/rails/v8.0.2/railties/lib/rails/rack/silence_request.rb`),
and its test stubs `Rails.logger` (`vendor/rails/v8.0.2/railties/test/rack_silence_request_test.rb:14-17`).

## Acceptance criteria

- `new SilenceRequest(app, { path })` reads `Trails.logger`, as Rails does; no logger option.
- The invented Error is gone, and any async silence shape is receipted.
- `rack-silence-request.test.ts` stubs `Trails.logger`, with a mock that does not run the block.
