---
title: "port-plugin-generator-test-onto-test-case"
status: done
updated: 2026-11-07
rfc: "0212-trailties-port"
cluster: null
packages: []
deps:
  - trailties-plugin-generator-part-2-and-plugin-command
deps-rfc: []
est-loc: 1400
priority: null
pr: trails#9797
claim: "2026-11-06T19:51:23Z"
assignee: "port-plugin-generator-test-onto-test-case"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/test/generators/plugin_generator_test.rb` (80 tests) has no `TestCase` port; `packages/trailties/src/generators/rails/plugin/plugin-generator.trails.test.ts` holds trails-only checks. Split from `port-app-and-plugin-generator-tests-onto-test-case`.

## Acceptance criteria

- `plugin_generator_test.rb` is ported onto `TestCase` with test names verbatim.
