---
title: "datetime-to-time-truncates-sub-minute-offset"
status: draft
updated: 2026-09-26
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

Surfaced while shipping trails#8122 (`datetime-civil-sub-minute-offset-loses-instant-on-cast`).

MRI's `DateTime#to_time` (`vendor/ruby/ext/date/date_core.c:9051-9077`) is
`Time.new(real_year, mon, mday, hour, min, sec + sec_fraction, of)` with the
exact integer offset `m_of`, so a sub-minute offset (LMT, e.g. -04:56:02)
names the exact instant.

trails' `DateTime#toTime` (`packages/date/src/date.ts:6595`) builds a
`Temporal.PlainDateTime` and calls `.toZonedDateTime(of2str(self.#of))`.
`of2str` truncates the offset to minutes, so the instant moves by the dropped
seconds. It also returns a `Temporal.ZonedDateTime` where MRI returns a `::Time`.

trails#8122 fixed the same truncation in `DateTime#toDatetime` by seating a
`SubMinuteOffsetZonedDateTime` at the exact instant; `toTime` still truncates.

## Acceptance criteria

- [ ] `DateTime#toTime` for a sub-minute offset names MRI's instant
      (`to_time.to_r` matches `ruby -rdate`).
- [ ] Preferably converge the return to `Time.new(...)` as `datetime_to_time` does.
