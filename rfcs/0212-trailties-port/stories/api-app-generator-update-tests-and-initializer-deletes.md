---
title: "api-app-generator-update-tests-and-initializer-deletes"
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

`vendor/rails/v8.0.2/railties/test/generators/api_app_generator_test.rb` has `test_app_update_does_not_generate_unnecessary_config_files` and `test_app_update_does_not_generate_public_files`, unported because `packages/trailties/src/generators/api-app-generator.test.ts` has no `update_config_files` path. `AppGenerator` also omits `delete_non_api_initializers_if_api_option` and `delete_api_initializers` (`railties/lib/rails/generators/rails/app/app_generator.rb:548-558`).

## Acceptance criteria

- Both tests are ported and both delete steps exist on `AppGenerator`.
