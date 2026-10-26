---
title: "tzinfo named-zone offsets from cached transition data, not Intl per lookup"
status: in-progress
updated: 2026-10-26
rfc: "0207-fugit-gem-family-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#9318
claim: "2026-10-26T01:18:25Z"
assignee: "configuration-test-framework-deprecators"
blocked-by: null
closed-reason: null
---

## Context

trails#9315 made `Cron#nextTime` cost about 0.063 ms under `TZ=UTC`. Most of that gain comes from
fixed-zone and UTC shortcuts, so a DST zone is still slow: the `* * * * *` brute_frequency example takes
297 s under `TZ=America/Detroit`, against 41 s under UTC.

The remaining cost is in `packages/tzinfo/src/index.ts`:

- `lookupZoneInfo` makes two `Intl.DateTimeFormat#formatToParts` calls per offset lookup.
- `Timezone#abbr` goes through `new DateTimezone(id).abbr(Time.at(...))`.

In `packages/date/src/time.ts`, a named zone's `#utcOffset` reads the polyfill's
`ZonedDateTime#offsetNanoseconds`, about 8 µs.

TZInfo answers `period_for_utc` from cached transition data: `DataSource#get_timezone_info` →
`TransitionsDataTimezoneInfo#period_for` does a binary search over transitions. The tzdata
`@blazetrails/date` carries already holds the flip instants (`tzdataIsdstFlips`).

## Acceptance criteria

- [ ] `Timezone#observedUtcOffset` / `periodForUtc` for a named DST zone are answered from cached
      per-zone transition data (offset per interval), with no `Intl` call per lookup.
- [ ] The `* * * * *` brute_frequency example runs in under 90 s under `TZ=America/Detroit` locally.
