---
title: "tzinfo-periods-read-transition-data"
status: draft
updated: 2026-10-25
rfc: "0207-fugit-gem-family-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9299 (et-orbi) added two Intl approximations to the TZInfo stand-in in
`packages/tzinfo/src/index.ts`. `tzinfo-stand-in-becomes-its-own-package`
(trails#9298) moved the package but shipped with these two criteria unchecked,
so they move here:

- `Timezone#periodForUtc` (`packages/tzinfo/src/index.ts:432`) derives a
  DST period's base offset by probing Jan 1 / Jul 1 of the year. That is wrong
  for a zone whose standard offset changed mid-year, or one that observes DST
  all year.
- `TimezonePeriod#equals` (`packages/tzinfo/src/index.ts:147`) compares
  abbreviation and offsets. TZInfo 2's `TransitionsTimezonePeriod#==`
  compares the start and end transitions. `vendor/et-orbi/v1.2.11/lib/et-orbi/time.rb:225`
  (`EoTime#==`'s `current_period == current_period`) relies on it.

`@blazetrails/date` carries the tzdata transitions (`tzdataIsdst`,
`Timezone#abbr`), so the data is available.

## Acceptance criteria

- [ ] `Timezone#periodForUtc` reads the period's base UTC offset and std offset from tzdata transition data, not the Jan 1 / Jul 1 probe.
- [ ] `TimezonePeriod` carries its start and end transitions, and `equals` compares them as `TransitionsTimezonePeriod#==` does.
- [ ] The et-orbi suite (`packages/et-orbi/src/*.test.ts`) and `packages/activesupport/src/time-zone*.test.ts` stay green.
