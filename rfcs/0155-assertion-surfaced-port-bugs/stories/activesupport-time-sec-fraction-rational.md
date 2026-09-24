---
title: "Time#sec_fraction returns a number; Rails returns a Rational"
status: in-progress
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: trails#8043
claim: "2026-09-24T17:14:05Z"
assignee: "website-sandbox-drops-base-adapter-assignment"
blocked-by: null
closed-reason: null
---

## Context

Parked test `sec fraction` in `packages/activesupport/src/core-ext/time-ext.test.ts` (converged body, `it.skip`). Rails `test_sec_fraction` (`vendor/rails/activesupport/test/core_ext/time_ext_test.rb:112-126`) asserts `assert_kind_of Rational, time.sec_fraction` and equality with `Rational(1, 1_000_000_000)`. The port (`packages/activesupport/src/core-ext/time/calculations.ts:100`, `secFraction`) returns `this.subsec`, a `number` (`packages/date/src/time.ts:1230`). Rails: `activesupport/lib/active_support/core_ext/time/calculations.rb` `sec_fraction` = `subsec`, and Ruby `Time#subsec` is a Rational.

Not investigated beyond reading those two definitions; whether `Time.utc(..., Rational)` / `Time.utc(..., 0, 0.001)` construction keeps enough precision is unverified.

## Acceptance criteria

- `Time#sec_fraction` (and `subsec`) return a `Rational`; `sec fraction` un-skipped and green.
