---
title: "TimeWithZone transfer_time_values_to_utc_constructor and #- converge to Rails' single arm"
status: done
updated: 2026-11-21
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#10472
claim: "2026-11-21T02:27:35Z"
assignee: "receipt-or-converge-xml-mini-builder-surface"
blocked-by: null
closed-reason: null
---

## Context

`TimeWithZone#transfer_time_values_to_utc_constructor` is a single expression in Rails:
`::Time.utc(time.year, time.month, time.day, time.hour, time.min, time.sec + time.subsec)`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/time_with_zone.rb:585-587`).

trails' `_transferTimeValuesToUtcConstructor` (`packages/activesupport/lib/time-with-zone.ts`, around line 202) has
an `instanceof Time && isUtc()` early return, a `DateTime` arm, and a nested ternary over
`Time` / `Temporal.Instant` / `Temporal.PlainDate` / `Temporal.ZonedDateTime` / `PlainDateTime`
that rebuilds `values` before calling `Time.utc`. `TimeWithZone#-` (same file, `minus`) also keeps
separate `Temporal.PlainDateTime | ZonedDateTime`, `Date`, and `Temporal.Instant` arms where Rails has
`other.acts_like?(:time)` → `getutc - other.getutc` (`time_with_zone.rb:341-343`).

## Acceptance criteria

- `_transferTimeValuesToUtcConstructor` is the one Rails expression over a receiver that answers
  `year`/`month`/`day`/`hour`/`min`/`sec`/`subsec` (Time, DateTime); Temporal inputs are converted to a
  Ruby Time/DateTime at the TimeWithZone boundary, not branched on here.
- `TimeWithZone#-` takes Rails' `acts_like?(:time)` arm with `other.getutc`, dropping the per-Temporal arms.
- Existing time-with-zone tests stay green.
