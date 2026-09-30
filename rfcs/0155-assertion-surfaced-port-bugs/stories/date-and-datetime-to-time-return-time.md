---
title: "date-and-datetime-to-time-return-time"
status: ready
updated: 2026-09-30
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

Surfaced while shipping `datetime-to-time-truncates-sub-minute-offset`.

MRI's `Date#to_time` (`vendor/ruby/v3.3.11/ext/date/date_core.c` `date_to_time`) is
`Time.local(real_year, mon, mday)` and `DateTime#to_time` (`date_core.c:9051-9077`,
`datetime_to_time`) is `Time.new(real_year, mon, mday, hour, min, sec + sec_fraction, of)`.
Both return a `::Time`.

trails' `Date#toTime` / `DateTime#toTime` (`packages/date/src/date.ts`) return a
`Temporal.ZonedDateTime` (DateTime seats a `SubMinuteOffsetZonedDateTime` for a
sub-minute offset), although `packages/date/src/time.ts` already ports `Time`
(`new Time(y, m, d, h, mi, s, zone)` takes an integer/sub-minute offset, and
`Time.local`). `test-date-conv.test.ts` "to class" encodes the deviation: it
expects `Temporal.ZonedDateTime` where `test_date_conv.rb` expects `Time`.

## Acceptance criteria

- [ ] `Date#toTime` returns `Time.local(realYear, mon, mday)` and `DateTime#toTime`
      returns `new Time(realYear, mon, mday, hour, min, sec + sfInSec, of)`, as MRI.
- [ ] `test-date-conv.test.ts` "to class" and the "to time from date/datetime" cases
      assert against `Time` readers as `test_date_conv.rb` does.
- [ ] Callers of `toTime()` outside `packages/date` (≈5 non-test sites) are updated.
