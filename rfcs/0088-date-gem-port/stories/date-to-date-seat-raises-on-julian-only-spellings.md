---
title: "Date#to_date's Temporal seat raises on a Julian-only spelling the state now holds"
status: done
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6272
claim: "2026-08-09T01:45:47Z"
assignee: "date-to-date-seat-raises-on-julian-only-spellings"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping `date-state-julian-only-spellings-unbuildable` (PR #6267).

That story moved `Date`'s state onto the Julian day (`SimpleDateData`'s
`HAVE_JD` arm, `vendor/date/ext/date/date_core.c:203-213`), so
`Date.new(1500, 2, 29)` now builds and answers `to_s` `"1500-02-29"`, `jd`
2268992, `wday` 6 and `yday` 60, as `ruby 3.3.11 -rdate` does. The residue moved
rather than closed: it is now on the **return seat**, not the state.

`Date#toDate` (`packages/date/src/date.ts`, the port of `date_to_date`,
`date_core.c:8977-8981`) converts the Julian day through `plainDateFromJd` to
the `Temporal.PlainDate` RFC 0088's mapping table names as trails' `::Date`
value. `Temporal.PlainDate` is proleptic Gregorian, so a Julian-only civil date
has no value to convert to and `plainDateFromJd` raises
`Date::Error, "invalid date"`. MRI's `Date#to_date` answers `self` and never
raises.

Every static that answers the seat inherits this: `Date.civil`, `Date.jd`,
`Date.ordinal`, `Date.commercial`, `Date.parse` and `Date.strptime` all end at
`.toDate()`, so `Date.civil(1500, 2, 29)` raises where `Date.new(1500, 2, 29)`
succeeds. Pinned as the current behaviour by
`date.trails.test.ts`'s `"builds a Julian-only civil date, as the HAVE_JD state
does"`, whose last assertion is `expect(() => date.toDate()).toThrow`.

The affected range is the days before the 1582 reform where the Julian calendar
has a spelling the proleptic Gregorian one does not — every Julian leap day a
century rule removes: 1500-02-29, 1400-02-29, 1300-02-29 and so on back.

## Converged shape

No Rails counterpart to converge the _conversion_ toward — MRI has no seat, its
`::Date` value is the gem object. What is open is RFC 0088's mapping decision:

- Narrow the mapping so a pre-reform `::Date` answers the gem-shaped object
  rather than `Temporal.PlainDate`, which is the only value that can hold it.
  `Date`'s ruby-shaped opt-in already exists (`date-temporal-default-return-and-ruby-opt-in`,
  PR #6264), so this is a documented carve-out on the default return rather than
  new surface.
- Or accept the raise as a permanent limit of the seat and say so in RFC 0088's
  mapping table alongside the other Temporal carve-outs, with the affected range
  named.

Decide and record which; the current state is neither — the raise is documented
at `plainDateFromJd` and on `Date#toDate` but the mapping table still says
`::Date` -> `Temporal.PlainDate` unconditionally.

## Acceptance criteria

- [ ] `Date.civil(1500, 2, 29)` and `Date.parse("1500-02-29")` have a decided,
      documented behaviour, cited against `date_core.c:8977-8981`.
- [ ] RFC 0088's mapping table says what a pre-reform `::Date` answers.
- [ ] `date.trails.test.ts` covers the statics, not only `Date#toDate`.
- [ ] `pnpm parity:api:extra --package date` clean; no new baseline rows.
