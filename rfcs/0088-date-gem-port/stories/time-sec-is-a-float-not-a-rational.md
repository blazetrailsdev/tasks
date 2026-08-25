---
title: "::Time#sec takes no Rational and rounds through toFixed, so a fractional second is inexact"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 6332
claim: "2026-08-10T12:26:37Z"
assignee: "date-side-builders-drop-num2int-with-frac-and-add-frac"
blocked-by: null
closed-reason: null
---

## Context

Found while porting `Time#to_datetime` coverage in PR 6320.
`ruby-time-carries-no-fractional-seconds` (#6156) gave trails' `::Time` a
sub-second, but it arrives through binary float arithmetic and it cannot be
handed a `Rational`.

`packages/date/src/time.ts`, `subsecNanoseconds`:

```ts
const fraction = sec - Math.floor(sec);
if (fraction === 0) return 0;
return Number(fraction.toFixed(20).split(".")[1].slice(0, 9));
```

and the constructor's `sec = 0` parameter is typed `number`.

Two consequences:

1. **Exactness.** `new Time(2008, 3, 1, 6, 0, 7.456789).nsec` is `456788999`,
   not `456789000` — the decimal never existed exactly as a double and
   `toFixed(20)` reports the binary value. MRI's `Time.new(2008, 3, 1, 6, 0,
7.456789).nsec` is `456789000`, because `::Time` holds the second as a
   Rational and `rb_time_timespec` rounds to the nanosecond. This is
   observable through `to_datetime`, `strftime("%N")` and `#nsec`.
2. **`Rational` argument.** MRI's `Time.new` takes a Rational second —
   `Time.new(2008, 3, 1, 6, 0, Rational(1, 3))` — which is the form
   `datetime_to_time` (`vendor/date/ext/date/date_core.c:9053-9055`) itself
   passes: `f_add(INT2FIX(m_sec(dat)), m_sf_in_sec(dat))`. trails' `Time`
   rejects it at the type level, and `subsecNanoseconds` would throw on it at
   runtime (`fraction.toFixed` is not a `Rational` method).

The repo already has the exact type this needs: `Rational` in
`packages/date/src/date.ts`, which `DateTime` uses for `#sf` for precisely
this reason (`datetime-sec-fraction-is-always-a-rational`, done).

## Converged shape

- Widen the `Time` constructor's `sec` (and `Time.mktime` / `Time.utc`'s) to
  `number | Rational`, as MRI's is.
- Compute the nanosecond from the `Rational` rather than from `toFixed`:
  a `number` `sec` converts to a `Rational` first, so one path serves both and
  the rounding is MRI's nanosecond rounding rather than a decimal-string
  slice.

## Acceptance criteria

- [ ] `new Time(2008, 3, 1, 6, 0, 7.456789).nsec` is `456789000`.
- [ ] `new Time(2008, 3, 1, 6, 0, new Rational(1, 3))` constructs, and
      `#strftime("%9N")` answers `333333333`.
- [ ] `subsecNanoseconds`' `toFixed(20)` string slice is gone.
- [ ] Covered in `packages/date/src/time.trails.test.ts`; the `to_datetime`
      seat test in `date.trails.test.ts` that PR 6320 had to write against
      `7.25` (a binary-exact fraction) can move back to `7.456789`.
