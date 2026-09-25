---
title: "TimeWithZone built with a TZInfo Timezone throws on inspect (reads tzinfo.identifier)"
status: in-progress
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8085
claim: "2026-09-25T14:11:37Z"
assignee: "time-subsec-drops-subnano-residual"
blocked-by: null
closed-reason: null
---

## Context

Rails' `TimeWithZone` accepts any duck-typed zone, including a bare `TZInfo::Timezone`.
`vendor/rails/activesupport/test/core_ext/time_with_zone_test.rb:670-680`
(`test_marshal_dump_and_load_with_tzinfo_identifier`) builds
`ActiveSupport::TimeWithZone.new(@utc, TZInfo::Timezone.get("America/New_York"))` and
calls `.inspect` on the result. In trails, `packages/activesupport/src/time-with-zone.ts`
`_zoned` (and `:293`, `:422`, `:469`) reads `this._timeZone.tzinfo.identifier`. A
`Timezone` has no `tzinfo`, so `inspect()` on such a TWZ throws
`TypeError: Cannot read properties of undefined (reading 'identifier')`. #8043's test
sidesteps this by only inspecting the round-tripped value, which `marshal_load`
re-wraps through `Time.find_zone`.

Rails reaches the zone only through its public protocol: `time_zone.period_for_utc`,
`time_zone.utc_to_local` and `time_zone.name` (`time_with_zone.rb:73-80,91-93,127`).
Converged shape: route those reads through the protocol methods both `TimeZone` and
`Timezone` answer, not through `tzinfo.identifier`.

## Acceptance criteria

- `new TimeWithZone(utc, Timezone.get("America/New_York")).inspect()` returns
  Rails' string.
- No `_timeZone.tzinfo` read remains in `time-with-zone.ts`, or each remaining one
  cites a Rails line that makes the same read.
