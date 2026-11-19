---
title: "A production boot opens log/production.log even when config.logger is set"
status: draft
updated: 2026-11-19
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
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

`examples/cloudflare-worker/config/environments/production.ts` sets `config.logger` to a
`TaggedLogging` over stdout, yet every Worker boot prints "Unable to access log file. Please ensure that
/bundle/log/production.log exists and is writable" from Ruby-compat's `LogDevice`. Rails'
`initialize_logger` (`vendor/rails/v8.0.2/railties/lib/rails/application/bootstrap.rb:33-58`) builds the
file logger only under `Rails.logger ||= config.logger || begin … end`. Find which trails path opens the
file first.

## Acceptance criteria

- [ ] With `config.logger` set in an environment file, no boot opens `log/<env>.log`, as in Rails.
- [ ] A trailties test pins it.
