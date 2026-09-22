---
title: "TimeWithZone method_missing proxy returns undefined/TypeError instead of NoMethodError"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Parked `no method error has proper context` in `packages/activesupport/src/core-ext/time-with-zone.test.ts`. Rails `test_no_method_error_has_proper_context` (`vendor/rails/activesupport/test/core_ext/time_with_zone_test.rb:1151-1157`) expects `NoMethodError` with message matching `undefined method 'x' for ... ActiveSupport::TimeWithZone` and a backtrace that does not mention `rescue`. The port's Proxy (`packages/activesupport/src/time-with-zone.ts:104`, `methodMissing` at `:156`) surfaced a `TypeError` in the old test (`thisMethodDoesNotExist is not a function`). See CLAUDE.md § "Records are not Proxies" for the per-class decision on Proxies.

## Acceptance criteria

- The proxy raises `NoMethodError` with Rails' message; test un-skipped.
