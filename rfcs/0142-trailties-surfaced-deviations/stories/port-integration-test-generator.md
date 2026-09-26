---
title: "Port the integration_test generator"
status: ready
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 150
priority: 6
pr: null
claim: null
assignee: null
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
