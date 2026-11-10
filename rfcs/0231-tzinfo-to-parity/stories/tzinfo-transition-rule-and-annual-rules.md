---
title: "Port TransitionRule's hierarchy and AnnualRules"
status: draft
updated: 2026-11-10
rfc: "0231-tzinfo-to-parity"
cluster: null
packages:
  - "tzinfo"
deps:
  - "tzinfo-offset-transition-and-periods"
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
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
