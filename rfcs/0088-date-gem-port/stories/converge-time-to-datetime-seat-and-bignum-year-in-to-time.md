---
title: "Time#toDatetime uses the public constructor, not d_complex_new_internal's seat, and to_time narrows a Bignum year"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6320
claim: "2026-08-10T02:06:33Z"
assignee: "converge-time-to-datetime-seat-and-bignum-year-in-to-time"
blocked-by: null
closed-reason: null
---

## Context

Shipped in #6314 (`port-test-date-conv`). Two conversion methods in the
`to_time` / `to_datetime` cluster reach a seat the C does not, and each loses
something as a result.

**1. `Time#toDatetime` (`packages/date/src/time.ts`) goes through the public
`DateTime` constructor.** `time_to_datetime`
(`vendor/date/ext/date/date_core.c:8901-8935`) calls
`d_complex_new_internal(cDateTime, nth, 0, 0, sf, of, GREGORIAN, ry, m, d, h,
min, s, HAVE_CIVIL | HAVE_TIME)` — the whole second `s`, the sub-second `sf` and
the offset `of` in SECONDS, each in its own field. That seat is `SEAT`-guarded
and private to `./date.ts`, so the port folds `s` and `sf` into one `Rational`
`second` and spells `of` as `new Rational(of, 86400)` for the public
constructor's day-fraction `offset`. Both round-trip today, but the port no
longer reads like the C and the day-fraction offset is a lossy spelling of what
the C hands over exactly.

**2. `Date#toTime` (`packages/date/src/date.ts`) narrows the year to a
`number`.** `date_to_time` (`date_core.c:8949-8971`) is
`f_local3(rb_cTime, m_real_year(adat), INT2FIX(m_mon(adat)),
INT2FIX(m_mday(adat)))` and `m_real_year` answers a Bignum once `nth` is
nonzero. `Date#year` already answers `number | bigint` for exactly that reason,
and the port does `Number(self.year)`, so a date past the Fixnum range converts
through a lossy `number` instead of raising the way MRI's `Time.local` does on
an out-of-range year. `DateTime#toTime` (`date_core.c:9032-9062`) has the same
`Number(self.year)`.

## Converged shape

- Export the `SEAT` complex-`DateTime` constructor to `./time.ts` (it already
  crosses that boundary for `of2str`) so `Time#toDatetime` passes `s`, `sf` and
  `of` as the three fields `d_complex_new_internal` takes.
- Carry the `bigint` year through `Date#toTime` / `DateTime#toTime`, raising
  where MRI's `Time.local` raises rather than truncating.

## Acceptance criteria

- [ ] `Time#toDatetime` builds through the same seat `time_to_datetime` uses,
      with `of` in seconds and `sf` separate from the whole second.
- [ ] `Date#toTime` and `DateTime#toTime` do not narrow a `bigint` year to a
      `number`; an out-of-range year raises rather than silently converting.
- [ ] Covered in `packages/date/src/test-date-conv.test.ts` / the trails test
      file alongside the existing conversion coverage.
