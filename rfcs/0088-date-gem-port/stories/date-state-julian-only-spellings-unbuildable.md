---
title: "date-state-julian-only-spellings-unbuildable"
status: done
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6267
claim: "2026-08-09T00:45:54Z"
assignee: "date-state-julian-only-spellings-unbuildable"
blocked-by: null
closed-reason: null
---

## Context

PR for `date-constructor-is-proleptic-gregorian-not-italy` put `Date`'s
civil<->jd conversions onto `date_core.c`'s `c_civil_to_jd` /
`c_jd_to_civil` under `DEFAULT_SG` (= `Date::ITALY`), so `wday`, `yday`, `jd`
and `%s` now agree with MRI at and before the calendar reform. One residue
remains, and it is the substrate rather than the conversions.

`Date` stores its state as a `Temporal.PlainDate`
(`packages/date/src/date.ts`, `#date`), which is proleptic Gregorian and can
only hold spellings that calendar has. A Julian-only civil date — 1500-02-29,
1400-02-29, 1300-02-29: real days under `Date::ITALY`, since Julian leap years
have no century rule — has no such spelling, so `plainDateFromJd`
(`packages/date/src/date.ts`) raises `Date::Error, "invalid date"` where MRI
builds the date.

Measured on ruby 3.3.11 vs trails:

```text
Date.new(1500, 2, 29)  ruby "1500-02-29" (jd 2268992, wday 6)  trails Date::Error
Date.new(1400, 2, 29)  ruby "1400-02-29" (jd 2232467, wday 0)  trails Date::Error
Date.new(1300, 2, 29)  ruby "1300-02-29" (jd 2195942, wday 1)  trails Date::Error
```

A 4000-subject live-MRI differential over -3000..2400 is otherwise clean on
`%A %a %u %w %s %j %G %V %U %W`, the civil date, `jd`, `wday` and `yday`, so
this is the only known remaining divergence in the family.

Pinned by `date.trails.test.ts`'s "raises Date::Error on a civil date
c_valid_civil_p rejects", whose `civilOrError(1500, 2, 29)` expects `"E"` with
a comment naming this story's cause.

## Converged shape

`Date`'s state becomes the Julian day (`SimpleDateData`'s `HAVE_JD` arm,
`date_core.c:203-213`) rather than a `Temporal.PlainDate`, with the civil
triple decoded through `c_jd_to_civil` on read (`get_c_civil`,
`date_core.c:1297-1324`) — which is what MRI does and what removes the
substrate's spelling constraint entirely. `DateTime`'s `#date`,
`jdLocalToUtc` / `jdUtcToLocal` (which currently do `Temporal` day
arithmetic) and `activesupport`'s `date-ext.ts` consumers move with it.

Note `jd_local_to_utc` day arithmetic across the reform boundary is wrong for
the same reason today and converges with the same change.

## Acceptance criteria

- [ ] `Date.new(1500, 2, 29)` builds, and answers `to_s` `"1500-02-29"`, `jd`
      2268992 and `wday` 6, as MRI does.
- [ ] The three cases above match a live `ruby -rdate -e`.
- [ ] `date.trails.test.ts`'s `civilOrError(1500, 2, 29)` expectation flips
      from `"E"` to `[1500, 2, 29]` and the comment naming this residue goes.
- [ ] Everything the existing suite pins stays green; post-reform dates are
      byte-identical.
