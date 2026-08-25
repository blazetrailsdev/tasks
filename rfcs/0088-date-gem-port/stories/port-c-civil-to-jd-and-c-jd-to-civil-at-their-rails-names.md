---
title: "jdOf / jdToPlainDate stand in for c_civil_to_jd / c_jd_to_civil under invented names"
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
pr: 6208
claim: "2026-08-07T22:48:41Z"
assignee: "port-c-civil-to-jd-and-c-jd-to-civil-at-their-rails-names"
blocked-by: null
closed-reason: null
---

## Context

`port-the-jdn-helper-layer-behind-wnumx-and-cwyear` (PR #6203) named
`cJdToCivil` and `cCivilToJd` in its converged shape and did not deliver them —
the JDN readers it did converge (`wnumx`, `cwyear`, `cweek`) had no need of
them. The two conversions exist in `packages/date/src/date.ts` under invented
names instead:

- `jdOf(d: Temporal.PlainDate): number` (`date.ts:2869-2871`) stands in for
  `c_civil_to_jd` (`vendor/date/ext/date/date_core.c:502-524`).
- `jdToPlainDate(jd: number): Temporal.PlainDate` (`date.ts:2874-2882`) stands
  in for `c_jd_to_civil` (`date_core.c:526-554`).

Both are read by `cFindFdoy`, `cCommercialToJd`, `cJdToCommercial`,
`cJdToWeeknum`, `cValidCommercialP`, `cValidWeeknumP` and `cValidOrdinalP` — so
every JDN site in the file goes through a name a Rails/ruby-date reader cannot
line up against the C.

## Converged shape

Rename to `cCivilToJd(y, m, d)` and `cJdToCivil(jd)`, taking the C's argument
lists rather than a `Temporal.PlainDate`, and keep the existing `sg`/`ns`
treatment the neighbouring helpers already document (proleptic Gregorian, no
calendar reform to represent). `Temporal.PlainDate` stays the substrate — the
deviation being converged is the _name and signature_, not the arithmetic.

Note `c_jd_to_civil`'s `jd < sg` Julian arm and `c_civil_to_jd`'s `jd -= b`
correction are both reform-only and stay unported, as `jdToPlainDate`'s
docstring already records.

## Acceptance criteria

- [ ] `cCivilToJd` and `cJdToCivil` exist at their Rails names with the C's
      parameter lists; `jdOf` / `jdToPlainDate` are gone.
- [ ] Every existing caller is updated; no behavior change.
- [ ] `packages/date/src/date.trails.test.ts` and `time.trails.test.ts` pass
      untouched.
