---
title: "::DateTime#to_s answers Date's date-only string, dropping the time and offset"
status: done
updated: 2026-08-07
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6165
claim: "2026-08-07T02:08:30Z"
assignee: "datetime-to-s-drops-the-time-of-day"
blocked-by: null
closed-reason: null
---

## Context

`::DateTime#to_s` answers `::Date`'s date-only string, dropping the time of day
and the offset it now carries.

```text
trails:      new DateTime(2008, 3, 1, 6, 0, 0).toS()  // => "2008-03-01"
ruby 3.3.11: DateTime.new(2008, 3, 1, 6, 0, 0).to_s   # => "2008-03-01T06:00:00+00:00"
```

`packages/date/src/date.ts`'s `DateTime` never overrides `toS`, so it inherits
`Date#toS`'s `strftime("%Y-%m-%d")`. MRI defines a separate
`dt_lite_to_s` (`vendor/date/ext/date/date_core.c`, registered on `cDateTime` in
`Init_date_core`) whose format is `"%Y-%m-%dT%H:%M:%S%:z"` — a distinct C
function from `d_lite_to_s`, which is why `::Date` keeps the short form.

Surfaced while porting the fractional second (PR #6161); out of that PR's scope.

## Converged shape

`DateTime` overrides `toS` with `dt_lite_to_s`'s format, leaving `Date#toS`
alone. Every formatter directive it needs (`%:z`) is already ported.

## Acceptance criteria

- [ ] `DateTime.new(2008, 3, 1, 6, 0, 0).toS()` is `"2008-03-01T06:00:00+00:00"`.
- [ ] A parsed non-UTC offset round-trips: `DateTime.parse("2008-03-01T06:00:00+09:00").toS()`
      is `"2008-03-01T06:00:00+09:00"`.
- [ ] `Date#toS` is unchanged — MRI's `Date.new(2008, 3, 1).to_s` is `"2008-03-01"`.
- [ ] Verify each value against a live `ruby -rdate -e`.
