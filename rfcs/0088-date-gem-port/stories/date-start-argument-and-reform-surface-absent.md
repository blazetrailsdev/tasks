---
title: "Date carries no start argument: Date::JULIAN/GREGORIAN, #start, #julian? and #new_start are all absent"
status: done
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6285
claim: "2026-08-09T16:16:12Z"
assignee: "date-start-argument-and-reform-surface-absent"
blocked-by: null
closed-reason: null
---

## Context

PR #6250 seated `Date`/`DateTime` on the calendar reform: `c_civil_to_jd` /
`c_jd_to_civil` (`vendor/date/ext/date/date_core.c:502-554`), the three
`c_find_*` scans (`:455-499`) and `c_valid_civil_p` / `c_valid_ordinal_p` all
take an `sg` parameter in the C's position, and `wday` / `yday` / `jd` / `%s`
read through it. But `sg` is only ever `DEFAULT_SG`: the `start` ARGUMENT that
selects it is not a parameter anywhere in `packages/date/src/date.ts`, and the
surface that exposes it is absent.

Missing, all in `date_core.c`:

- `Date::JULIAN` (`:188`) and `Date::GREGORIAN` (`:189`) — trails has only
  `ITALY` (`:186`) and `DEFAULT_SG` (`:190`), both module-private.
- The trailing `start = Date::ITALY` parameter on `Date.new` / `Date.civil`
  (`date_s_civil`), `Date.jd` (`date_s_jd`, `:3377-3387`), `Date.ordinal`
  (`:3394`), `Date.commercial`, `Date.parse` and `Date.strptime`
  (`date_s_strptime`, `:4424-4447`), and the `DateTime` counterparts.
- `Date#start` (`d_lite_start`), `Date#julian?` / `Date#gregorian?`
  (`d_lite_julian_p` / `d_lite_gregorian_p`), `Date#new_start`
  (`d_lite_new_start`), `Date#italy` / `Date#england`.

The conversions are already `sg`-taking, so this is largely a matter of
threading the argument from the constructors and adding the readers — the
`#date` seat is the part that is not ready, which is why this is filed
separately from [[date-state-julian-only-spellings-unbuildable]].

## Converged shape

`Date` carries `start` as `SimpleDateData`'s `sg` does
(`date_core.c:203-213`), every constructor takes it as its last argument with
`Date::ITALY` as the default, and the readers above answer off it. The
existing `sg = DEFAULT_SG` defaults on `cCivilToJd`, `cJdToCivil`,
`cValidCivilP`, `cValidOrdinalP`, `cFindFdoy`, `cFindLdoy` and `cFindLdom`
become the value threaded from the receiver.

`Date::JULIAN` / `Date::GREGORIAN` are `positive_inf` / `negative_inf` in the
C — every day is Julian, or every day is Gregorian. The `sg` comparisons are
all `jd < sg`, so `Infinity` / `-Infinity` carry them directly.

## Ordering

Depends on [[date-state-julian-only-spellings-unbuildable]]: under
`Date::JULIAN` a caller can name 1500-02-29 deliberately, and the
`Temporal.PlainDate` seat cannot hold it, so the `start` argument is not
meaningfully supportable until the state moves to the Julian day.

## Acceptance criteria

- [ ] `Date.new(1582, 10, 10, Date::GREGORIAN)` builds where the default
      `Date::ITALY` raises, and `Date.jd(2299160, Date::GREGORIAN)` is
      1582-10-14 where the default is 1582-10-04.
- [ ] `#start`, `#julian?`, `#gregorian?` and `#new_start` answer as MRI does.
- [ ] Verify each value against a live `ruby -rdate -e`.
- [ ] The existing default-`sg` behaviour is byte-identical.
