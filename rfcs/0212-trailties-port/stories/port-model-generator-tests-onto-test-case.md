---
title: "Port model_generator_test.rb onto TestCase"
status: in-progress
updated: 2026-11-02
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: trails#9640
claim: "2026-11-02T22:38:07Z"
assignee: "actions-generate-runs-in-line"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/test/generators/model_generator_test.rb` (66 tests). Split further if it exceeds one PR.

Sizing comes from the pilot `trailties-port-generator-tests-onto-generators-test-case`: about 9 LOC per Rails test on `controller_generator_test.rb`, about 33 on `scaffold_generator_test.rb`.

## Acceptance criteria

- Each named Rails file is ported onto `TestCase` with `copyRoutes` from `generators-test-helper.ts`, test names verbatim, and ad-hoc helpers and snapshots it replaces are deleted.
