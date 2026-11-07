---
title: "port-plugin-helpers-with-new-plugin"
status: blocked
updated: 2026-11-07
rfc: "0212-trailties-port"
cluster: null
packages: []
deps:
  - trailties-plugin-generator-part-2-and-plugin-command
  - port-trailties-plugin-command
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-11-07T10:47:07Z"
assignee: "port-plugin-helpers-with-new-plugin"
blocked-by: "scaffold-generator-engine-subprocess-tests waiting on port-trailties-plugin-command: no bin/trails plugin command exists for with_new_plugin to shell out to"
closed-reason: null
---

## Context

`test_controller_tests_pass_by_default_inside_mountable_engine` and `..._inside_full_engine` (`vendor/rails/v8.0.2/railties/test/generators/scaffold_controller_generator_test.rb`) call `with_new_plugin` from `vendor/rails/v8.0.2/railties/test/generators/plugin_helpers.rb`, which has no trails counterpart. Both are empty `it.skip`s in `packages/trailties/src/generators/rails/scaffold-controller/scaffold-controller-generator.test.ts`.

## Acceptance criteria

- `with_new_plugin` is ported beside `generators-test-helper.ts`.
- Both tests run un-skipped with their Rails bodies.
