---
title: "Thread ruby/date's calendar-reform start argument through the c_* date family"
status: done
updated: 2026-08-05
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6111
claim: "2026-08-05T01:44:55Z"
assignee: "i18n-date-calendar-reform-start-argument"
blocked-by: null
closed-reason: null
---

## Context

Every date-building function in `packages/i18n/src/date.ts` drops ruby/date's
calendar-reform argument. In date-3.4.1 (`ext/date/date_core.c`) it is threaded
through the whole family as `double sg`:

- `c_find_fdoy(int y, double sg, ...)` (`date_core.c:455-464`) does not assume 1
  January exists — it scans `d = 1..30` for the first day
  `c_valid_civil_p(y, 1, d, sg, ...)` accepts, because the Julian→Gregorian
  cutover deletes real days (1582-10-05..14 under `Date::ITALY`).
- `c_valid_civil_p` / `c_valid_ordinal_p` / `c_valid_commercial_p` /
  `c_valid_weeknum_p` (`date_core.c:726-838`) all take `sg` and pass it down.
- `c_commercial_to_jd` / `c_jd_to_commercial` / `c_weeknum_to_jd` /
  `c_jd_to_weeknum` (`date_core.c:575-634`) take `sg` and set `*ns` from it.
- `Date.commercial(cwyear = -4712, cweek = 1, cwday = 1, start = Date::ITALY)`
  (`date_s_commercial`, `date_core.c:3606-3640`, `rb_scan_args "04"`) takes it
  as a fourth argument; `Date.parse(str, comp = true, start = Date::ITALY)`
  takes it as a third.

The trails port is proleptic-ISO throughout: `cFindFdoy` is
`jdOf(new Temporal.PlainDate(y, 1, 1))`, none of the `c_*` helpers take an `sg`
parameter, `Date.commercial` has three parameters and `Date.parse` two. So
`Date.parse("1582-10-10")` answers a date Ruby rejects under the default
`Date::ITALY`, and `Date.jd(2299160).to_s` would disagree.

Not observed as a live bug — nothing in Rails passes a `start`, and the merged
sweeps (700 `:wnum0` strings, 1500 mixed) agree with ruby 3.3.11 across
1969-2069, well clear of the cutover. It is a dropped parameter nobody reasoned
about at the Ruby, and it is one every `c_valid_*_p` signature carries.

Filed out of #6104, which ported `c_valid_commercial_p` / `c_valid_weeknum_p` /
`c_find_fdoy` and dropped `sg` from each to match the file's existing shape
rather than widening scope.

**The date gem source is NOT vendored** (C stdlib, no `vendor/rails`
counterpart). On this host it reads at
`~/.asdf/installs/ruby/3.3.11/lib/ruby/gems/3.3.0/gems/date-3.4.1/ext/date/date_core.c`;
`gem contents date` prints nothing because `date` is a default gem.

## Converged shape

`sg` threaded through the `c_*` family with ruby/date's name and position,
`Date::ITALY` / `Date::GREGORIAN` / `Date::JULIAN` defined as ruby/date defines
them, `cFindFdoy` scanning as `c_find_fdoy` does, and `Date.commercial` /
`Date.parse` taking their trailing `start` argument.

## Acceptance criteria

- [ ] `Date.parse("1582-10-10")` raises and `Date.parse("1582-10-10", true, Date::GREGORIAN)` does not, matching ruby 3.3.11.
- [ ] `Date.commercial`'s and `Date.parse`'s trailing `start` argument is present, with ruby/date's default.
- [ ] `cFindFdoy` scans rather than assuming 1 January, per `date_core.c:455-464`.
- [ ] Regression coverage across the cutover in `date.trails.test.ts`, verified against the interpreter.
