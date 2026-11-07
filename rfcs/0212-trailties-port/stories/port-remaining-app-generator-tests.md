---
title: "port-remaining-app-generator-tests"
status: done
updated: 2026-11-07
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9798
claim: "2026-11-06T19:47:38Z"
assignee: "port-remaining-app-generator-tests"
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/generators/app-generator.test.ts` now runs on `TestCase` (`AppGeneratorTest.arguments([destinationRoot])`, `runAppUpdate` from `generators-test-helper.ts`), but only ~16 of the 146 tests in `vendor/rails/v8.0.2/railties/test/generators/app_generator_test.rb` (plus `shared_generator_tests.rb`) are ported. Unported examples: `test_skip_bundle` (:100), `test_invalid_javascript_option_raises_an_error` (:109), `test_app_update_supports_skip` (:179), `test_app_update_supports_pretend` (:192), `test_app_update_does_not_remove_rack_cors_if_already_present` (:207), `test_app_update_generates_public_folders` (:215), the `test_app_update_preserves_skip_*` family (:253-330).

## Acceptance criteria

- The remaining `app_generator_test.rb` tests are ported onto `TestCase` in `app-generator.test.ts` with Rails test names verbatim, in PRs within the size ceiling; tests whose subsystem trails lacks are parked with a cited `it.skip`.
