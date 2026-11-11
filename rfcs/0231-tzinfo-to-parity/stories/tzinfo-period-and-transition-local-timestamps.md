---
title: "Port the TimestampWithOffset members of TimezoneTransition and TimezonePeriod"
status: draft
updated: 2026-11-11
rfc: "0231-tzinfo-to-parity"
cluster: null
packages:
  - tzinfo
deps:
  - tzinfo-with-offset-classes
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

trails#10003 ported `TimezoneOffset`, `TimezoneTransition`, `TimezonePeriod`,
`OffsetTimezonePeriod` and `TransitionsTimezonePeriod`, but left out every
member that returns a `TimestampWithOffset`. That class comes with
`tzinfo-with-offset-classes`. The members still missing are:

- `TimezoneTransition#local_end_at` / `#local_start_at`
  (`vendor/tzinfo/v2.0.6/lib/tzinfo/timezone_transition.rb:62-82`)
- `TimezonePeriod#local_starts_at` / `#local_ends_at` and the private
  `timestamp_with_offset`
  (`vendor/tzinfo/v2.0.6/lib/tzinfo/timezone_period.rb:138-156,175-177`)

TS: `packages/tzinfo/lib/timezone-transition.ts`, `timezone-period.ts`.

## Acceptance criteria

- [ ] All five members are ported at their gem names, with the gem's control
      flow.
- [ ] `test_local_end_at` and `test_local_start_at` (`tc_timezone_transition.rb`)
      are ported by name, along with `test_local_starts_at_bounded` /
      `_unbounded` and `test_local_ends_at_bounded` / `_unbounded`
      (`tc_timezone_period.rb`).
