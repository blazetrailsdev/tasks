---
title: "Port the integration_test generator"
status: in-progress
updated: 2026-11-07
rfc: "0212-trailties-port"
cluster: null
packages: ["trailties"]
deps: ["port-generators-hook-for-and-app-generators-options"]
deps-rfc: []
est-loc: 150
priority: 6
pr: trails#9837
claim: "2026-11-07T16:17:07Z"
assignee: "with-integration-routing-is-a-namespace-not-a-concern"
blocked-by: null
closed-reason: null
---

## Context

Rails ships `railties/lib/rails/generators/rails/integration_test/`
(`integration_test_generator.rb` plus its template), which the `test_unit`
integration generator backs. trails has no counterpart under
`packages/trailties/src/generators/rails/`. Split out of
`port-rails-test-help-for-applications`, whose AC allowed filing it.

## Acceptance criteria

- `trails generate integration_test <name>` exists, mirroring
  `integration_test_generator.rb` (hook_for :integration_tool, as: :integration)
  and the test_unit template (`test/integration/<name>_test`), writing a test
  that subclasses `ActionDispatch::IntegrationTest` and imports the generated
  `test/test-helper.ts`.
- Generator test mirrors `railties/test/generators/integration_test_generator_test.rb`.
