---
title: "TimeZone#utcOffset reads tzinfo current_period.base_utc_offset"
status: draft
updated: 2026-09-16
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::TimeZone#utc_offset` is
`@utc_offset || tzinfo&.current_period&.base_utc_offset`
(`activesupport/lib/active_support/values/time_zone.rb:317-319`).

trails' `TimeZone#utcOffset` (`packages/activesupport/src/values/time-zone.ts`,
converged in trails#7837) cannot read a base offset: the Intl-backed `Timezone`
wrapper exposes only the observed offset. It derives it as
`observed - |julOffset - janOffset|` while DST is in effect at `currentTime()`.
That assumes one DST period per year straddled by Jan/Jul, and is wrong for
zones with rule changes inside the year or non-hour DST quirks.

## Converged shape

- `Timezone#currentPeriod()` returning a `TimezonePeriod` that carries
  `baseUtcOffset` (TZInfo `TimezonePeriod#base_utc_offset`).
- `get utcOffset() { return this._utcOffset ?? this.tzinfo?.currentPeriod()?.baseUtcOffset }`,
  a one-line mirror of `time_zone.rb:318`.

## Acceptance criteria

- `TimeZone#utcOffset` body is the Rails one-liner over a ported `current_period.base_utc_offset`.
- `time_zone_test.rb` stays 0/0/0; `utc offset is not cached when current period gets stale` still passes.
