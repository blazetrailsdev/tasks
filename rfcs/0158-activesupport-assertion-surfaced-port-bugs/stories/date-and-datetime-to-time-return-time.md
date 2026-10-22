---
title: "Date#to_time and DateTime#to_time return a Time, not a Temporal.ZonedDateTime"
status: ready
updated: 2026-09-30
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping `datetime-to-time-truncates-sub-minute-offset`, and
again in trails#8114 (`time-to-time-returns-zoned-date-time-not-time`), which
converged `Time#toTime` to return the `Time` itself. This story absorbs the
duplicate `date-and-datetime-to-time-return-zoned-date-time-not-time`.

Ruby's `Date#to_time` and `DateTime#to_time` both return a `Time`:

- MRI: `date_to_time` (`vendor/ruby/v3.3.11/ext/date/date_core.c:8973`) is
  `Time.local(real_year, mon, mday)`, and `datetime_to_time`
  (`date_core.c:9051-9077`) is
  `Time.new(real_year, mon, mday, hour, min, sec + sec_fraction, of)`.
- ActiveSupport reopens both: `Date#to_time(form = :local)`
  (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/date/conversions.rb:83`)
  and `DateTime#to_time`
  (`core_ext/date_time/compatibility.rb:15`, `preserve_timezone ? getlocal(utc_offset) : getlocal`).
- `vendor/ruby/v3.3.11/test/date/test_date_conv.rb:16-20` (`test_to_class`)
  asserts `assert_instance_of(Time, o.to_time)` for `Time.now`, `Date.today`
  and `DateTime.now`.

trails' `Date#toTime()` (`packages/date/src/date.ts:5591`) and
`DateTime#toTime()` (`date.ts:6661`) return a `Temporal.ZonedDateTime`
(DateTime seats a `SubMinuteOffsetZonedDateTime` for a sub-minute offset),
although `packages/date/src/time.ts` already ports `Time` and `Time.local`.
The free `toTime` in `packages/activesupport/src/core-ext/time/compatibility.ts`
still carries a Temporal-DateTime arm that returns a `ZonedDateTime`.
`packages/date/src/test-date-conv.test.ts` "to class" encodes the deviation,
expecting `Temporal.ZonedDateTime` for the Date and DateTime rows.

## Acceptance criteria

- [ ] `Date#toTime` returns `Time.local(realYear, mon, mday)` and
      `DateTime#toTime` returns `new Time(realYear, mon, mday, hour, min, sec + sfInSec, of)`,
      as `date_core.c:8973,9051` do; callers that wanted the Temporal value use
      a renamed conversion, following `Time#toTime` in trails#8114.
- [ ] ActiveSupport's `Date#to_time(form)` and `DateTime#to_time` reopenings
      are installed on the prototypes, as `core-ext/time/compatibility.ts`
      does for `Time`, and the free `toTime` goes away.
- [ ] `test-date-conv.test.ts` "to class" asserts `Time` for all three rows,
      as `test_date_conv.rb:16-20` does.
- [ ] `pnpm typecheck`, `parity:api:calls` and `parity:api:calls:args` are green.
