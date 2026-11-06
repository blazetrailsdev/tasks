---
title: "port-app-generator-test-onto-test-case"
status: in-progress
updated: 2026-11-06
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 2500
priority: null
pr: trails#9777
claim: "2026-11-06T10:17:07Z"
assignee: "port-app-generator-test-onto-test-case"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/test/generators/app_generator_test.rb` (146 tests) still runs through the ad-hoc `makeGen` helpers in `packages/trailties/src/generators/app-generator.test.ts`. Split from `port-app-and-plugin-generator-tests-onto-test-case`; `api-app-generator.test.ts` is the model, and `copyRoutes` is now async.

## Acceptance criteria

- `app_generator_test.rb` is ported onto `TestCase` with test names verbatim, in PRs of the size ceiling, and the ad-hoc helpers are deleted.
