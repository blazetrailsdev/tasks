---
title: "Port TransitionRule's hierarchy and AnnualRules"
status: blocked
updated: 2026-11-14
rfc: "0231-tzinfo-to-parity"
cluster: null
packages:
  - "tzinfo"
deps:
  - tzinfo-offset-transition-and-periods
  - tzinfo-timestamp-create-and-for
  - tzinfo-with-offset-classes
deps-rfc: []
est-loc: 500
priority: 4
pr: null
claim: "2026-11-14T13:31:10Z"
assignee: "tzinfo-transition-rule-and-annual-rules"
blocked-by: "TransitionRule#at (transition_rule.rb) calls Timestamp.for and TimestampWithOffset.set_timezone_offset; both unported (tzinfo-timestamp-create-and-for draft, tzinfo-with-offset-classes blocked)"
closed-reason: null
---

## Context

`vendor/tzinfo/v2.0.6/lib/tzinfo/transition_rule.rb` (13: `TransitionRule`,
`DayOfYearTransitionRule`, `AbsoluteDayOfYearTransitionRule`,
`JulianDayOfYearTransitionRule`, `DayOfWeekTransitionRule`,
`DayOfMonthTransitionRule`, `LastDayOfMonthTransitionRule`) and
`annual_rules.rb` (7) have no TS files. Tests: `tc_transition_rule.rb`,
`tc_annual_rules.rb`. These model the POSIX-TZ tail of a TZif file.

## Acceptance criteria

- [ ] Both files are ported with the full class hierarchy and every member.
- [ ] Both test files are ported by name.
