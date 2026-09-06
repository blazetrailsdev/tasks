---
title: "TimeZone#period_for_local / periods_for_local read the epoch where TZInfo ignores the offset"
status: claimed
updated: 2026-09-06
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: "2026-09-06T20:10:04Z"
assignee: "json-serialization-tests-stand-ins-are-person-not-contact"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #7551 while converging
`set-time-zone-without-conversion-rebuilds-the-wall-clock`. That story made
`setTimeZoneWithoutConversion` the Rails one-liner
`::Time.zone.local_to_utc(value).try(:in_time_zone) if value`
(`activerecord/lib/active_record/attribute_methods/time_zone_conversion.rb:52-54`),
which exposed that trails' `local_to_utc` was reading the wrong thing.

TZInfo's local-side entry points take a time whose UTC **offset is ignored** —
`Timestamp.for(local_time, offset: :ignore)` — so the value's own wall clock IS
the local time. trails' shim in `packages/activesupport/src/values/time-zone.ts`
reads the value's **epoch** instead, via `toDate(time).getTime()`. For a Time
carrying a non-UTC offset the two differ by that offset.

PR #7551 fixed exactly one of the three: `Timezone#localToUtc` now converts through
a new `ignoringOffset` helper. The other two local-side entry points still read
the epoch and were left alone because nothing in that PR reached them:

- `Timezone#periodsForLocal` (`time-zone.ts`) — `const localMs =
toDate(time).getTime()`, then searches the offsets around that instant.
- `Timezone#periodForLocal` — takes the same value and forwards it, and its
  `PeriodNotFound` / `AmbiguousTime` messages render it with
  `toDate(time).toISOString()`, so a wrong seat also produces a wrong message.

Both are public Rails API through `TimeZone#period_for_local` /
`#periods_for_local` (`activesupport/lib/active_support/values/time_zone.rb`,
`def period_for_local(time, dst = true)` forwarding to
`tzinfo.period_for_local(time, dst) { |periods| periods.last }`), so a caller
handing either an offset-carrying `::Time` gets the period for the wrong
instant — and near a DST boundary, the wrong period rather than merely a
shifted one.

## Converged shape

`periodsForLocal` and `periodForLocal` take the wall clock the same way
`localToUtc` now does, so all three local-side entry points share one reading of
"local time" and match TZInfo's `offset: :ignore` contract. `ignoringOffset` is
already in the file; this is moving the two remaining call sites onto it, and
pinning a DST-boundary case where the offset actually changes the answer.

## Acceptance criteria

- [ ] `periodsForLocal` and `periodForLocal` read the value's wall clock, not
      its epoch, for a Time carrying a non-UTC offset.
- [ ] A case where the two readings select different DST periods is pinned and
      fails on the baseline.
- [ ] `time-zone.test.ts` and `time-with-zone.test.ts` keep their names and pass.
