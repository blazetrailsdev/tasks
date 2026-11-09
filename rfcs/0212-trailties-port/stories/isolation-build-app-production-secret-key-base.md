---
title: "isolation-build-app-production-secret-key-base"
status: ready
updated: 2026-11-09
rfc: "0212-trailties-port"
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

`packages/trailties/test/application/initializers/frameworks.test.ts` "action_controller api executes using all the middleware stack" (Rails `railties/test/application/initializers/frameworks_test.rb:136-161`) uses rack-test, whose `app` boots `Rack#app("production")` (`railties/test/isolation/abstract_unit.rb:72`). Our `buildApp` app boots production without a `secret_key_base` and raises "Missing `secret_key_base` for 'production' environment" from `lib/application/configuration.ts:488`. Rails' template app carries credentials so production boots.

## Acceptance criteria

- `buildApp` produces an app that boots in production as Rails' template does.
- Un-skip the frameworks test above (`extend(t, Methods)` from `@blazetrails/rack-test`, then `get("omg/show")`) and it passes.
