---
title: "duration-divide-by-integer-keeps-float-parts"
status: in-progress
updated: 2026-09-20
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7903
claim: "2026-09-20T12:37:33Z"
assignee: "duration-divide-by-integer-keeps-float-parts"
blocked-by: null
closed-reason: null
---

## Context

Converging `core_ext/duration_test.rb`'s `test_inspect` under RFC 0132 surfaced a
divergence in `Duration#/` by a plain number.

Rails' `Duration#/`
(`vendor/rails/activesupport/lib/active_support/duration.rb:297-307`) is
`Duration.new(value / other, @parts.transform_values { |number| number / other }, @variable)`.
For `1.day / 24` the parts are `{ days: 1 }` and Ruby's `Integer#/` is **floor**
division, so `1 / 24` is `0`; `inspect`
(`duration.rb:400-416`) then rejects the zero-valued parts, finds none left, and
falls back to `"#{value} seconds"` — `"3600 seconds"`, which
`duration_test.rb:110` asserts (confirmed against MRI: `(1.day / 24).inspect`
is `"3600 seconds"`).

trails' `dividedBy` (`packages/activesupport/src/duration.ts:209-230`) runs the
same `transformValues`, but JS `/` is float division, so the part becomes
`0.041666666666666664` and `inspect` reports
`"0.041666666666666664 days"`.

`packages/activesupport/src/core-ext/duration.test.ts`'s `inspect` is parked
`it.skip` with the converged body (Rails' 15 assertions) and a `BLOCKED:` line
pointing here; the other 14 rows pass.

## Acceptance criteria

- [ ] `Duration#dividedBy` reproduces Ruby's integer-part division so
      `Duration.day(1).dividedBy(24).inspect()` is `"3600 seconds"`.
- [ ] The parked `inspect` test is un-skipped and green with its converged body
      unchanged.
