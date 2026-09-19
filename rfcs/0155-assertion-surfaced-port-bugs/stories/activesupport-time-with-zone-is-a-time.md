---
title: "TimeWithZone is not an instance of Time (is_a? / kind_of?)"
status: draft
updated: 2026-09-19
rfc: "0155-assertion-surfaced-port-bugs"
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

Parked `is a` in `packages/activesupport/src/core-ext/time-with-zone.test.ts`. Rails `test_is_a` (`vendor/rails/activesupport/test/core_ext/time_with_zone_test.rb:648-652`) asserts `assert_kind_of Time, @twz`; `TimeWithZone#is_a?` answers true for `Time` (`activesupport/lib/active_support/time_with_zone.rb` `is_a?`). The port only offers `actsLikeTime()`; `twz instanceof RubyTime` is false. Related to `activesupport-time-ext-source-remainder`'s `Time.===`.

## Acceptance criteria

- `TimeWithZone` answers `Time` via `is_a?`/`kind_of?` and the `toBeInstanceOf(RubyTime)` form (or the settled trails idiom); test un-skipped.
