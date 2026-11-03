---
title: "port-plugin-helpers-with-new-plugin"
status: draft
updated: 2026-11-03
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

`test_controller_tests_pass_by_default_inside_mountable_engine` and `..._inside_full_engine` (`vendor/rails/v8.0.2/railties/test/generators/scaffold_controller_generator_test.rb`) call `with_new_plugin` from `vendor/rails/v8.0.2/railties/test/generators/plugin_helpers.rb`, which has no trails counterpart. Both are empty `it.skip`s in `packages/trailties/src/generators/rails/scaffold-controller/scaffold-controller-generator.test.ts`.

## Acceptance criteria

- `with_new_plugin` is ported beside `generators-test-helper.ts`.
- Both tests run un-skipped with their Rails bodies.
