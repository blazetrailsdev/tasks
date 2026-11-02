---
title: "port-plugin-generator-test-onto-test-case"
status: draft
updated: 2026-11-02
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

`vendor/rails/v8.0.2/railties/test/generators/plugin_generator_test.rb` (80 tests) has no `TestCase` port; `packages/trailties/src/generators/rails/plugin/plugin-generator.trails.test.ts` holds trails-only checks. Split from `port-app-and-plugin-generator-tests-onto-test-case`.

## Acceptance criteria

- `plugin_generator_test.rb` is ported onto `TestCase` with test names verbatim.
