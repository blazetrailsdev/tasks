---
title: "Port the scaffold tests that run inside a generated engine"
status: draft
updated: 2026-11-02
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/test/generators/scaffold_generator_test.rb:571-688` holds seven tests that shell out through `with_new_plugin` and `bin/rails`. They are `it.skip` in `packages/trailties/src/generators/rails/scaffold/scaffold-generator.test.ts`.

Sizing comes from the pilot `trailties-port-generator-tests-onto-generators-test-case`: about 9 LOC per Rails test on `controller_generator_test.rb`, about 33 on `scaffold_generator_test.rb`.

## Acceptance criteria

- The seven tests run against a generated engine.
