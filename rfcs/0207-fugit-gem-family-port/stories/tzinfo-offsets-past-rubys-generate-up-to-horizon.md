---
title: "tzinfo-offsets-past-rubys-generate-up-to-horizon"
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

Ruby tzinfo's `ZoneinfoReader` generates rule-based transitions only up to
`GENERATE_UP_TO = Time.now.utc.year + 100`
(tzinfo 2.0.6 `lib/tzinfo/data_sources/zoneinfo_reader.rb:16`, used at `:206`).
After that the last generated offset holds for good, which is standard time
for a northern zone. So `TZInfo::Timezone.get("Europe/London")` answers `+0` for
July 2594, while Node's `Temporal` keeps applying the POSIX rule and answers
`+1`. The port takes far-future offsets from `Temporal`
(`packages/tzinfo/src/index.ts` `getZoneInfo` / `zoneInterval`, and
`packages/date/src/time.ts` `zoneOffsetAt`), and its tzdata tables stop at
`HORIZON_YEAR = 2040` (`scripts/generate-tzdata-isdst.ts:28`).

The fugit-family fuzz (trails#9316) shows 35 dur cases at seed 20261025, all a
large `Duration` added to an `EoTime`, off by exactly 3600s. Some examples:
`P570Y` from 1712426459 in `Europe/London`, `P3Y525Y` in `Europe/Berlin`,
`P3Y794Y` in `PST8PDT`.

The cut-off moves with the clock (`Time.now.utc.year + 100`), so whatever the
port does has to be decided against Ruby's behaviour, not against a fixed year.

## Acceptance criteria

- A named zone's offset past Ruby's generation horizon matches Ruby tzinfo with
  a zoneinfo data source: the last generated offset holds. Regression values
  come from Ruby 3.3.11 + tzinfo 2.0.6.
- Offsets inside the horizon are unchanged.
- The fuzz's `dur: [5][0]` group is gone
  (`TZ=UTC pnpm tsx scripts/fugit-fuzz/fuzz.ts --seed 20261025 --count 2000 --surface dur`).
