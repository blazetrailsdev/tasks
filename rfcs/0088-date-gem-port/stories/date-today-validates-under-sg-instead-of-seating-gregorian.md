---
title: "date-today-validates-under-sg-instead-of-seating-gregorian"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: 6331
claim: "2026-08-10T13:05:58Z"
assignee: "date-new-must-discard-date-initialize-add-frac"
blocked-by: null
closed-reason: null
---

## Context

`Date.today` landed in PR #6317 (`packages/date/src/date.ts`) as:

```ts
static today(start = DEFAULT_SG): Temporal.PlainDate {
  const now = Temporal.Now.plainDateISO();
  return new Date(now.year, now.month, now.day, val2sg(start)).toDate();
}
```

`date_s_today` (`vendor/date/ext/date/date_core.c:3789-3826`) does NOT go
through `date_initialize`. It reads `localtime_r`'s `tm_year`/`tm_mon`/`tm_mday`,
runs `decode_year(INT2FIX(y), -1, &nth, &ry)` — the proleptic-Gregorian style,
`-1` — and stores the triple with

```c
d_simple_new_internal(klass, nth, 0, GREGORIAN, ry, m, d, HAVE_CIVIL);
... set_sg(dat, sg);
```

so the civil triple is always the GREGORIAN one and the requested reform is
written in AFTERWARDS, with no validation pass under it. The port instead hands
the triple to the `Date` constructor, which branches on `guessStyle(year, sg)`
and validates through `c_valid_civil_p` **under `sg`**. For `start` values on
the Julian side that reinterprets today's Gregorian wall date as a Julian civil
date, which is a different day.

`Date.today()` at the default reform is unaffected, which is why
`test_strftime` does not catch it.

## Converged shape

Follow `date_s_today`: `decodeYear(y, -1)` for the `nth`/`ry` split, seat the
civil triple directly under `GREGORIAN` through the `SEAT` constructor
overload — the `d_simple_new_internal` path, which validates nothing — and set
the reform after, as `set_sg` does. No `guessStyle` / `cValidCivilP` round trip.

## Acceptance criteria

- [ ] `Date.today(Date::JULIAN)` and `Date.today(Date::GREGORIAN)` answer the
      same absolute day as `Date.today()`, differing only in reform, as MRI's do.
- [ ] `Date.today` does not route through the `Date` constructor's
      `guessStyle` / `cValidCivilP` branch.
