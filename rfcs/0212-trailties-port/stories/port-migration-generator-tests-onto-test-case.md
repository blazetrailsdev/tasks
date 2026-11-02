---
title: "Port migration_generator_test.rb onto TestCase"
status: in-progress
updated: 2026-11-02
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: trails#9636
claim: "2026-11-02T18:21:42Z"
assignee: "zeitwerk-check-name-error-reaches-task-abort"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/test/generators/migration_generator_test.rb` (41 tests).

Sizing comes from the pilot `trailties-port-generator-tests-onto-generators-test-case`: about 9 LOC per Rails test on `controller_generator_test.rb`, about 33 on `scaffold_generator_test.rb`.

## Acceptance criteria

- Each named Rails file is ported onto `TestCase` with `copyRoutes` from `generators-test-helper.ts`, test names verbatim, and ad-hoc helpers and snapshots it replaces are deleted.
