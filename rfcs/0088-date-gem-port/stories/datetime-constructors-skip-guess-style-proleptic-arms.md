---
title: "Date/DateTime constructors never take guess_style's proleptic arms, and carry no nth"
status: done
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6290
claim: "2026-08-09T18:49:36Z"
assignee: "datetime-constructor-fraction-bound-ignores-offset-and-start"
blocked-by: null
closed-reason: null
---

## Context

`date_initialize` (`vendor/date/ext/date/date_core.c:7477-7520`) and
`datetime_initialize` (`:7851-7896`) both branch on `guess_style(y, sg)`
(`:2340-2360`): when it is negative the C takes a **proleptic Gregorian** arm
over `valid_gregorian_p` and stores `HAVE_CIVIL` with no Julian day at all;
when positive, a proleptic Julian one. It is negative for
`sg == Date::GREGORIAN` and for any `y > REFORM_END_YEAR`, positive for
`Date::JULIAN` and `y < REFORM_BEGIN_YEAR`, and — the case a JS number cannot
reach — for a non-`FIXNUM` year, which is how MRI answers
`Date.new(2**70, 1, 1).to_s` as `"1180591620717411303424-01-01"`.

trails' `Date`/`DateTime` constructors
(`packages/date/src/date.ts`, the `constructor(year, month, day, start)` arms)
always route through `c_valid_civil_p` under `sg` and always store a Julian
day. For every finite year that agrees with MRI — `jd < sg` with an infinite
`sg` selects the same calendar the proleptic arm would — so this is not a
value divergence today. What is missing is the branch itself and, with it, the
`nth` field (`:203-213`) that carries a Julian day past the `Fixnum` range, so
years outside roughly `±2**53 / 365` have no representation.

Filed from PR #6285, which seated the `start` argument and made the infinite-`sg`
arms reachable for the first time.

## Converged shape

Port `guess_style` and the two proleptic arms of both `*_initialize`
functions, so the constructor makes the branch the C makes and a date built
under `Date::JULIAN` / `Date::GREGORIAN` carries the C's own representation.
Whether `nth` can be carried at all is the open question the story has to
answer first: it may need a `bigint` half on the state, or an explicit
documented range limit if it cannot.

## Acceptance criteria

- [ ] `guess_style` exists with the C's three arms and is what the
      constructors branch on.
- [ ] `Date.new(y, m, d, Date::GREGORIAN)` and `Date.new(y, m, d, Date::JULIAN)`
      take the proleptic arms rather than the reform round-trip.
- [ ] Either a huge year round-trips as MRI's does, or the range limit is
      stated at the call site with the reason.
- [ ] Every value verified against a live `ruby -rdate -e`.
