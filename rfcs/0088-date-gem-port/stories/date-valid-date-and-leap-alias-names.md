---
title: "Date.valid_date? and Date.leap? — the second names Init_date_core registers — are unported"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6331
claim: "2026-08-10T12:06:36Z"
assignee: "converge-time-to-date-onto-d-simple-new-internal"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6315 (`port-test-date-new-jd-ordinal-civil`), which ported
`Date.valid_jd?`, `Date.valid_civil?`, `Date.valid_ordinal?`,
`Date.valid_commercial?`, `Date.julian_leap?` and `Date.gregorian_leap?` into
`packages/date/src/date.ts` as `isValidJd` / `isValidCivil` / `isValidOrdinal` /
`isValidCommercial` / `isJulianLeap` / `isGregorianLeap`.

Ruby registers two of those C functions under a **second** name as well, and
neither second name is ported:

- `Date.valid_date?` is `date_s_valid_civil_p`
  (`vendor/date/ext/date/date_core.c:9659`, alongside `valid_civil?` at `:9658`).
- `Date.leap?` is `date_s_gregorian_leap_p`
  (`date_core.c:9676`, alongside `gregorian_leap?` at `:9674`).

Both are the documented, commonly-used spellings — the rdoc for
`date_s_valid_civil_p` is itself written in terms of `Date.valid_date?`
(`date_core.c:2588-2590`). A caller reaching for `Date.valid_date?(2001, 2, 29)`
finds nothing.

The aliases were deliberately left out of #6315 as out of scope: nothing in
`test_date_new.rb`'s 7-214 range calls them, and the two delegating statics were
removed from that PR on review. They are worth having on their own.

## Converged shape

`isValidDate(year, month, mday, start = DEFAULT_SG)` delegating to
`isValidCivil`, and `isLeap(year)` delegating to `isGregorianLeap`, each with a
one-line JSDoc naming the `Init_date_core` registration line that makes it the
same C function — mirroring how the gem defines them, not as new behaviour.

## Acceptance criteria

- [ ] `Date.isValidDate` and `Date.isLeap` exist and answer exactly what
      `isValidCivil` / `isGregorianLeap` answer, including the non-Numeric arms
      (`false` for the predicate, `TypeError` for the leap check).
- [ ] Each cites its `date_core.c:9659` / `:9676` registration.
- [ ] Covered by a test in `packages/date/src/date.trails.test.ts` (no Ruby test
      in `test/date/` exercises the alias names, so this is a trails-only extra).
