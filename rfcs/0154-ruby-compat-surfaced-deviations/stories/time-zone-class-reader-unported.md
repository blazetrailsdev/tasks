---
title: "time-zone-class-reader-unported"
status: draft
updated: 2026-11-06
rfc: "0154-ruby-compat-surfaced-deviations"
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

Rails' `Time.zone` / `Time.zone=` / `Time.zone_default` / `Time.find_zone!` are class methods on `Time` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/time/zones.rb`). trails ports them as free functions in `packages/activesupport/src/time-zone-config.ts` (`zone`, `setZone`, `zoneDefault`, `findZoneBang`), with no `packages/activesupport/src/core-ext/time/zones.ts` and no member on ruby-compat's `Time` (`rbCTime`, `packages/ruby-compat/src/object.ts:346`). A template therefore cannot write Rails' `<%= Time.zone.name %>`: `ActionControllerTestCaseIntegrationTest`'s view (`vendor/rails/v8.0.2/railties/test/application/action_controller_test_case_integration_test.rb:52-54`) reads it through an `ApplicationHelper` fixture in `packages/trailties/src/application/action-controller-test-case-integration.test.ts`.

## Acceptance criteria

- `core_ext/time/zones.rb` is ported at `core-ext/time/zones.ts`, its class methods reachable as `Time.zone` etc. on the `Time` constant seated on `TopLevel`.
- The integration test's view reads `TopLevel.Time.zone().name` (or the settled spelling) and its `ApplicationHelper` fixture is deleted.
