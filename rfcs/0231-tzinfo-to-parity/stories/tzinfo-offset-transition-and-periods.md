---
title: "Finish TimezoneOffset, TimezoneTransition, TimezonePeriod and port OffsetTimezonePeriod / TransitionsTimezonePeriod"
status: done
updated: 2026-11-12
rfc: "0231-tzinfo-to-parity"
cluster: null
packages:
  - "tzinfo"
deps:
  - "tzinfo-timestamp"
deps-rfc: []
est-loc: 550
priority: 3
pr: trails#10003
claim: "2026-11-11T19:41:30Z"
assignee: "tzinfo-offset-transition-and-periods"
blocked-by: null
closed-reason: null
---

## Context

Partial: `timezone_offset.rb` 5/11 (`utc_offset`, `utc_total_offset`, `abbr`,
`dst?`, `eql?`, `hash`), `timezone_transition.rb` 4/9 (`at`, `local_end_at`,
`local_start_at`, `eql?`, `hash`), `timezone_period.rb` 12/20 (`zone_identifier`,
`starts_at`, `ends_at`, `local_starts_at`, `local_ends_at`, `timestamp`, …).
Missing files: `offset_timezone_period.rb` (5), `transitions_timezone_period.rb`
(5). Tests: `tc_timezone_offset.rb`, `tc_timezone_transition.rb`,
`tc_timezone_period.rb`, `tc_offset_timezone_period.rb`,
`tc_transitions_timezone_period.rb`. TS: `packages/tzinfo/lib/timezone-offset.ts`,
`timezone-transition.ts`, `timezone-period.ts`.

## Acceptance criteria

- [ ] Every listed member is ported, except the five that return a
      `TimestampWithOffset` (`TimezoneTransition#local_end_at` /
      `#local_start_at`, `TimezonePeriod#local_starts_at` / `#local_ends_at` /
      `timestamp_with_offset`) and their tests. Those wait on
      `tzinfo-with-offset-classes` and belong to
      `tzinfo-period-and-transition-local-timestamps`; `TimezonePeriod` is abstract with the two
      concrete subclasses, as in the gem.
- [ ] The five test files are ported by name.
