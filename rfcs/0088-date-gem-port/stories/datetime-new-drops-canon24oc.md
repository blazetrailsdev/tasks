---
title: "DateTime.new drops canon24oc, reaching midnight-next-day through the df fold instead"
status: done
updated: 2026-08-08
rfc: "0088-date-gem-port"
cluster: null
packages:
  - date
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6173
claim: "2026-08-07T13:54:41Z"
assignee: "datetime-new-drops-canon24oc"
blocked-by: null
closed-reason: null
---

## Context

`datetime_initialize` calls `canon24oc()` between `c_valid_time_p` and
`set_to_complex` (`vendor/date/ext/date/date_core.c:7882` and `7862`, the macro
at `date_core.c:3306-3312`):

```c
#define canon24oc() \
do {\
    if (rh == 24) {\
    rh = 0;\
    fr2 = f_add(fr2, INT2FIX(1));\
    }\
} while (0)
```

`c_valid_time_p` deliberately admits the `24:00:00` that ends a day
(`date_core.c:870-886`; ours at `packages/date/src/date.ts:1959-1979` mirrors
it), and `canon24oc` is what turns it into midnight of the NEXT day — by adding
a whole day to `fr2`, which `add_frac` then applies.

`DateTime`'s constructor (`packages/date/src/date.ts`) has no `canon24oc`. It
reaches the same answer for the plain case by accident: `timeToDf(24, 0, 0)` is
`86400`, which `jdLocalToUtc` reads as a day's overflow and `dfLocalToUtc` folds
back to `0`. That is a different mechanism, and it is now sharing a `df` with
PR #6163's `add_frac` day-carry, so the two are one arithmetic away from
disagreeing — `DateTime.new(2008, 3, 1, 24)` and its fractional neighbours are
untested in either direction.

Surfaced while porting `num2int_with_frac` (PR #6163); out of that PR's scope,
which touched only the fraction guard and its carry.

## Converged shape

Port `canon24oc` where the C calls it — after `cValidTimeP`, before the
local→UTC conversion — folding `rh === 24` to `0` and adding a day to `fr2`,
and let `add_frac`'s existing carry do the rest. The incidental
`timeToDf(24, 0, 0) === DAY_IN_SECONDS` path then stops being load-bearing.

Note `fr2` is carried in SECONDS in the port (the `*_trunc` ÷ `d_lite_plus` ×
`DAY_IN_SECONDS` cancellation, documented on `num2intWithFrac`), so the C's
`fr2 + 1` day is `fr2 + DAY_IN_SECONDS` here.

## Acceptance criteria

- [ ] `DateTime.new(2008, 3, 1, 24)` is 2008-03-02T00:00:00, through
      `canon24oc` rather than through the `df` fold.
- [ ] `DateTime.new(2008, 3, 1, 24, 0, 0.5)` keeps its fractional second across
      the roll.
- [ ] `c_valid_time_p`'s `24:00:00` admission and every other time-of-day are
      unchanged.
- [ ] Verify each value against a live `ruby -rdate -e`.
