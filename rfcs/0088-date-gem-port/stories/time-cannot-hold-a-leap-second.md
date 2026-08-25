---
title: "::Time cannot hold a leap second, so to_datetime's s == 60 fold is unreachable"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6332
claim: "2026-08-10T12:26:37Z"
assignee: "date-side-builders-drop-num2int-with-frac-and-add-frac"
blocked-by: null
closed-reason: null
---

## Context

Found while porting `Time#to_datetime` coverage in PR 6320. A leap-second
`::Time` cannot be constructed at all, so the arm that handles one is dead.

`time_to_datetime` (`vendor/date/ext/date/date_core.c:8913-8915`) carries an
explicit fold:

```c
s = FIX2INT(f_sec(self));
if (s == 60)
    s = 59;
```

and the port mirrors it (`packages/date/src/time.ts`, `toDatetime`:
`if (s === 60) s = 59;`). The C needs that fold because MRI's `::Time` really
does hold a 60th second — `Time.utc(2015, 6, 30, 23, 59, 60)` is a valid
value, and `#sec` answers `60` — while the gem's `DateTime` has no room for it.

trails' `Time` constructor (`packages/date/src/time.ts`) puts `sec` into a
`Temporal.PlainDateTime` positional slot, and Temporal rejects it:

```text
RangeError: value out of range: 0 <= 60 <= 59
  at RejectTime (@js-temporal/polyfill)
  at new Time (packages/date/src/time.ts)
```

So `Time.utc(2015, 6, 30, 23, 59, 60)` raises where MRI answers a time, and
the `s === 60` fold in `toDatetime` is unreachable through any public entry
point. A regression test for that arm cannot be written today, which is how
this surfaced.

## Converged shape

MRI accepts the 60th second at construction and reports it from `#sec`;
`Temporal` cannot hold it. The seat has to carry the leap second alongside the
`PlainDateTime` rather than inside it — the same shape `#utcOffset` already
uses for the sub-minute offsets a `Temporal` offset time zone cannot hold
(`packages/date/src/time.ts`, `utcOffsetArgument`'s JSDoc records that
precedent). Store the wall-clock second as `59` in the `PlainDateTime` and keep
the `60` in a trails-owned field that `#sec` answers, so:

- `Time.utc(2015, 6, 30, 23, 59, 60).sec` is `60`
- `Time.utc(2015, 6, 30, 23, 59, 60).to_datetime.to_s` is
  `"2015-06-30T23:59:59+00:00"`, which is what the `s == 60` fold produces

## Acceptance criteria

- [ ] `Time.utc(y, m, d, 23, 59, 60)` and `new Time(...)` construct rather
      than raising, and `#sec` answers `60`.
- [ ] `Time#toDatetime`'s `if (s === 60) s = 59` arm is reachable and covered
      in `packages/date/src/date.trails.test.ts` alongside the other
      `to_datetime` seat coverage PR 6320 added.
- [ ] `#strftime("%S")` agrees with `#sec`.
