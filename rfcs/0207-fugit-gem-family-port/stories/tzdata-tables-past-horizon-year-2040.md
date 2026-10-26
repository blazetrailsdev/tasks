---
title: "tzdata-tables-past-horizon-year-2040"
status: draft
updated: 2026-10-26
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

`scripts/generate-tzdata-isdst.ts` and `scripts/generate-tzdata-abbreviations.ts`
read Ruby tzinfo's transitions only up to `HORIZON_YEAR = 2040`. Past that year,
the readers in `packages/date/src/tzdata-isdst.ts` (`tzdataIsdst`) and
`tzdata-abbreviations.ts` (`tzdataAbbreviation`) hold the last bit or
abbreviation, which is standard time for a northern zone. Ruby tzinfo 2.0.6
keeps generating rule-based transitions up to
`GENERATE_UP_TO = Time.now.utc.year + 100`
(`lib/tzinfo/data_sources/zoneinfo_reader.rb:16`, `:206`, `:326`). So
`TZInfo::Timezone.get("Europe/London").period_for_utc(Time.utc(2050, 7, 1))`
is `dst? == true`, `BST` in Ruby, and `false` / `GMT` in the port. Offsets
already follow Ruby here, through `tzdataOffsetInstant`
(trails PR for `tzinfo-offsets-past-rubys-generate-up-to-horizon`).

The fugit-family fuzz (trails#9316), run against a rearguard zoneinfo
compiled from 2026b, shows this as the single `eo: [4]` case at seed 20261025:
`"2040-06-28 13:19:26 CET"`. Ruby gives `CEST`, the port `CET`.

Growing `HORIZON_YEAR` to 2126 would more than double both tables, so the reader
probably needs to extend the zone's final annual rule past the horizon instead.

## Acceptance criteria

- `tzdataIsdst` and `tzdataAbbreviation` answer Ruby tzinfo's values (zoneinfo
  data source) between `HORIZON_YEAR` and `GENERATE_UP_TO`. Regression values
  come from Ruby 3.3.11 + tzinfo 2.0.6.
- The committed tables do not grow by more than a few percent.
- `TZ=UTC pnpm tsx scripts/fugit-fuzz/fuzz.ts --seed 20261025 --count 2000 --surface eo`
  has no `2040-06-28 ... CET` case.
