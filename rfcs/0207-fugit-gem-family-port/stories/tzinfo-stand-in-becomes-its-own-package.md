---
title: "tzinfo-stand-in-becomes-its-own-package"
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

The TZInfo 2 stand-in (`Timezone`, `TimezonePeriod`, `TimezoneOffset`,
`ConstantOffsetDataTimezoneInfo`, `AmbiguousTime`, `PeriodNotFound`,
`InvalidTimezoneIdentifier`, the tzdata 2026c `TZDB_NAMES` list, the Intl
helpers, and the `TZInfo` namespace object) lives in
`packages/activesupport/src/values/time-zone.ts`. TZInfo is a gem, so it belongs
in its own `@blazetrails/tzinfo` package, as i18n, thor and chronic do.

The et-orbi half (et-orbi dropping its `@blazetrails/activesupport`
dependency, `@blazetrails/date` `Time#compare` / `Time#equals`, and unparking
`vendor/et-orbi/v1.2.11/spec/eo_time_spec.rb:781`) moved to
`et-orbi-drops-activesupport-for-tzinfo`, by the owner's direction, because
`packages/et-orbi` was not on main when this story shipped (trails#9298).

## Acceptance criteria

- [ ] `packages/tzinfo/` holds the stand-in; activesupport imports `Timezone`
      and friends from it, and `TimeZone` stays in activesupport.
- [ ] Decide and record whether tzinfo 2.x is vendored and compared, or the
      package is not API-compared.
- [ ] `Timezone#periodForUtc` reads a period's base offset from transition data,
      not the Jan 1 / Jul 1 probe in `packages/activesupport/src/values/time-zone.ts`
      (wrong for zones whose standard offset changed mid-year or that keep DST all year).
- [ ] `TimezonePeriod#equals` compares start/end transitions, as TZInfo 2's
      `TransitionsTimezonePeriod#==` does, not abbreviation and offsets
      (`vendor/et-orbi/v1.2.11/lib/et-orbi/time.rb:225` relies on it).
