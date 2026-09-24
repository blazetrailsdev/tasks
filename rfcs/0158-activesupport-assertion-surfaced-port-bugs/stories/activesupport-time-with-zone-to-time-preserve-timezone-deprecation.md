---
title: "TimeWithZone#to_time without preserve_timezone: deprecation, class and identity"
status: done
updated: 2026-09-24
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8044
claim: "2026-09-24T17:44:04Z"
assignee: "activesupport-time-with-zone-subnanosecond-fractions"
blocked-by: null
closed-reason: null
---

## Context

Parked `to time without preserve timezone configured` in `packages/activesupport/src/core-ext/time-with-zone.test.ts` (7 Rails assertions; 3 before). Rails `test_to_time_without_preserve_timezone_configured` (`vendor/rails/activesupport/test/core_ext/time_with_zone_test.rb:602-616`) asserts a deprecation via `assert_deprecated`, `time.class == Time`, `time.object_id == @twz.to_time.object_id` (memoized), local `Time` equality, `utc_offset`, `zone`, and `ActiveSupport.to_time_preserves_timezone == false`. The port's `toTime` is at `packages/activesupport/src/time-with-zone.ts`. The parked body has not been run; which of these fail is unverified.

## Acceptance criteria

- All assertions pass; test un-skipped.
