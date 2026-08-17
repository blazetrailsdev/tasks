---
title: "Rational() takes a Float on either side; DateTime#since drops its nanosecond widening"
status: done
updated: 2026-08-17
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6628
claim: "2026-08-17T02:02:56Z"
assignee: "port-date-time-conversions-onto-its-own-receiver"
blocked-by: null
closed-reason: null
---

## Context

`Rational`'s constructor in `packages/date/src/date.ts` (`class Rational`,
`constructor(num: number | bigint, den: number | bigint)`) does
`BigInt(num) / BigInt(den)`, so it accepts Integers only — a non-integral
`number` throws `RangeError: The number ... cannot be converted to a BigInt`.

Ruby's `Rational()` (`rational.c` `nurat_s_convert` / `rb_Rational`) takes a
Float on either side: `Rational(0.5, 86400)` is
`(1/172800)`, and `Rational(1.333, 1)` is the exact binary fraction
`(6004799503160661/4503599627370496)`. On ruby 3.3.11 both are ordinary
values, and `date_core.c`'s `d_lite_plus` T_RATIONAL arm consumes them
without rounding.

`DateTime#since` is the site that surfaced it. Rails writes
`self + Rational(seconds, 86400)`
(`vendor/rails/activesupport/lib/active_support/core_ext/date_time/calculations.rb:116-118`),
and `date_time_ext_test.rb:161-162` asserts `since(1.333)` and `since(1.667)`
are NOT the whole-second neighbours — i.e. a fractional `seconds` is a
supported input. The trails port
(`packages/activesupport/src/core-ext/date-time/calculations.ts`, `since`)
cannot write `new Rational(seconds, 86400)`, so it carries the value as a
nanosecond count over the matching denominator:

    new Rational(Math.round(seconds * 1_000_000_000), 86_400_000_000_000)

That agrees with Ruby to nanosecond precision — which is what the receiver's
`sf` holds — and cancels back to `Rational(seconds, 86400)` for an Integer
`seconds` through the constructor's own gcd. It is still a deviation: the
literal Rails expression is unwritable, the rounding is ours, and any future
caller passing a sub-nanosecond fraction diverges silently. `DateTime#advance`
reaches the same `since` with a Float `seconds_to_advance` whenever
`:days` / `:weeks` carry a fraction (`calculations.rb:82-105`), so the path is
live, not hypothetical.

## Converged shape

Give `Rational`'s constructor Ruby's Float arm — `nurat_s_convert`'s
`float_to_r` path (`rational.c`, `numeric.c` `rb_flt_rationalize` /
`float_decode`), which is exact: a `number` is a binary fraction, so the
mantissa/exponent decode is lossless and needs no rounding choice. Then
`DateTime#since` can be spelled exactly as Rails spells it:

    new RubyDateTime(datetime).plus(new Rational(seconds, 86400)).toDatetime()

and the nanosecond widening plus its JSDoc paragraph are deleted. Check the
other `new Rational(` call sites in `packages/date/src/date.ts` and
`packages/activesupport/src/` for the same workaround before landing; the
constructor change must not shift any existing Integer-argument result
(gcd-cancelled, so it should not).

Related, already landed and worth reading first:
`rational-is-number-backed-not-arbitrary-precision` and
`rational-does-not-canonicalize-denominator-one-to-integer` (RFC 0088).

## Acceptance criteria

- [ ] `new Rational(x, y)` accepts a non-integral `number` on either side and
      answers the same value Ruby's `Rational()` does, verified against
      `ruby -e` output for at least `Rational(0.5, 86400)`, `Rational(1.333, 1)`
      and `Rational(1, 0.5)`.
- [ ] `DateTime#since` (`core-ext/date-time/calculations.ts`) is
      `new Rational(seconds, 86400)`, with the nanosecond-widening JSDoc
      paragraph removed.
- [ ] `date_time_ext_test.rb:161-162`'s `since(1.333)` / `since(1.667)`
      assertions still pass, and the `advance` fractional-day arms
      (`test_advance_partial_days`) are unchanged.
- [ ] No other `new Rational(` call site changes result.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative;
      `parity:api:calls` / `:args` clean.
