---
title: "duration-since-rejects-a-datetime-receiver"
status: done
updated: 2026-09-20
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7903
claim: "2026-09-20T12:37:28Z"
assignee: "duration-since-rejects-a-datetime-receiver"
blocked-by: null
closed-reason: null
---

## Context

Converging `core_ext/numeric_ext_test.rb`'s assertions under RFC 0132 surfaced a
real port gap: `Duration#since` / `#until` reject a `DateTime` receiver.

Rails' `ActiveSupport::Duration#sum`
(`vendor/rails/activesupport/lib/active_support/duration.rb:435-459`) guards with
`time.acts_like?(:time) || time.acts_like?(:date)`, and `DateTime` answers true to
both (`core_ext/date_time/acts_like.rb`). So every `@dtnow` arm of
`NumericExtTimeAndDateTimeTest` works upstream —
`3000.days.since(@dtnow)`, `1.month.until(@dtnow)`, `(1.day + 1.month).since(@dtnow)`.

trails' `Duration#sum` (`packages/activesupport/src/duration.ts:399-410`) guards on
a fixed instanceof list — `Date`, `Temporal.Instant`, `Temporal.PlainDate`,
`RubyTime`, plus an `actsLikeTime?.()` duck-check — and
`Temporal.PlainDateTime` (what `DateTime.civil` returns,
`packages/date/src/date.ts:6034`) is in none of them and carries no
`actsLikeTime`. Every `dtnow` arm therefore raises
`ArgumentError: expected a time or date, got 2005-02-10T15:30:45`.

Five tests in `packages/activesupport/src/core-ext/numeric-ext.test.ts` are
parked `it.skip` with converged bodies (Rails' full assertion count and kinds)
and a `BLOCKED:` line pointing here:

- `irregular durations` (8 assertions)
- `duration addition` (6)
- `time plus duration` (8)
- `chaining duration operations` (4)
- `duration after conversion is no longer accurate` (4)

The Time half of each already passes; only the `DateTime` half raises.

## Acceptance criteria

- [ ] `Duration#sum` accepts a `DateTime` receiver, mirroring Rails'
      `acts_like?(:date)` arm rather than widening the instanceof list ad hoc.
- [ ] The five parked tests above are un-skipped and green, with their converged
      assertion bodies unchanged.
- [ ] `pnpm parity:test -- --package activesupport --assertions` reports
      `core_ext/numeric_ext_test.rb` at 0 count / 0 kind / 0 value mismatches.
