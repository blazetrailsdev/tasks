---
title: "ActiveSupport TimeZone passes a Time to tzinfo, retiring Timezone's Date converter"
status: ready
updated: 2026-11-21
rfc: "0231-tzinfo-to-parity"
cluster: null
packages: []
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

trails#10476 made `TZInfo::Timezone#abbr`, `#observedUtcOffset` and `#isDst` read `period_for(time)`, as `vendor/tzinfo/v2.0.6/lib/tzinfo/timezone.rb:1048,1059,1094` do. `Timestamp.for` (`timestamp.rb`) accepts only a Time, DateTime, Timestamp or time-like value. ActiveSupport still passes JS `Date` / `Temporal.Instant` values (`packages/activesupport/lib/values/time-zone.ts` `utcOffset` getter, `utcOffsetAt`, `abbr`, `isDst`), so `packages/tzinfo/lib/timezone.ts` keeps a module-private `toTime(Date | Temporal.Instant | Time)` converter, receipted `@noRailsEquivalent CONVERGEABLE tzinfo-timezone-reads-the-data-source`, and widens those three signatures to accept `Date | Temporal.Instant`.

Rails' `ActiveSupport::TimeZone#utc_offset` (`vendor/rails/v8.0.2/activesupport/lib/active_support/values/time_zone.rb`) reads `tzinfo.current_period.base_utc_offset`, and `#abbr` / `#dst?` take a Time.

## Acceptance criteria

- ActiveSupport's `TimeZone` passes a `Time` (or calls `currentPeriod`) everywhere it reaches tzinfo, mirroring `time_zone.rb`.
- `toTime` is deleted from `timezone.ts`, and `abbr`, `observedUtcOffset` and `isDst` take `time: Time = Time.now()` only.
