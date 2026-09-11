---
title: "Mix DateAndTime::Calculations into Time so TimeWithZone#method_missing reaches months_since"
status: draft
updated: 2026-09-11
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails mixes `DateAndTime::Calculations` into `Time` (`vendor/rails/activesupport/lib/active_support/core_ext/time/calculations.rb:13`, `include DateAndTime::Calculations`), so `Time#months_since`, `#weeks_since`, `#years_ago` and the rest are instance methods. That also means `TimeWithZone#method_missing` (`time_with_zone.rb`) reaches them through `@twz.time`.

In trails they are module functions taking `dateOrTime` (`packages/activesupport/src/core-ext/date-and-time/calculations.ts:233`, `monthsSince`). They are not installed on `RubyTime.prototype`: `core-ext/time/calculations.ts` only installs Time's own methods in its `Object.assign(RubyTime.prototype, …)`. So a TimeWithZone cannot reach them through `methodMissing`.

This came up in #7690. `test_method_missing_with_time_return_value` (`activesupport/test/core_ext/time_with_zone_test.rb:654-657`) calls `@twz.months_since(1)`. The trails port (`packages/activesupport/src/time-with-zone.test.ts`, "method missing with time return value") had to use `nextMonth()` instead.

## Acceptance criteria

- `DateAndTime::Calculations` instance methods are available on `RubyTime.prototype`, via `include()` or `Object.assign` in `core-ext/time/calculations.ts`, with `this`-typed bodies matching the Rails names.
- "method missing with time return value" calls `monthsSince(1)`, as the Rails test does.
- `pnpm parity:api:calls` does not gain a row.
