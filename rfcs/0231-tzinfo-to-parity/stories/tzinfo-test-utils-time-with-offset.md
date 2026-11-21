---
title: "Port test_utils.rb's time_with_offset helpers and assert_equal_with_offset_and_timezone_offset"
status: blocked
updated: 2026-11-21
rfc: "0231-tzinfo-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-11-21T22:36:40Z"
assignee: "activesupport-time-zone-passes-time-to-tzinfo"
blocked-by: "waits on tzinfo-with-offset-classes (TimeWithOffset/DateTimeWithOffset/TimestampWithOffset unported)"
closed-reason: null
---

## Context

trails#10465 ported `vendor/tzinfo/v2.0.6/test/test_utils.rb` to `packages/tzinfo/test/support/test-utils.ts`, but left out the members that need the unported `TimeWithOffset` / `DateTimeWithOffset` / `TimestampWithOffset` classes:

- `TimeTypesTimeHelper#time_with_offset` (`test_utils.rb:188-190`), `TimeTypesDateTimeHelper#time_with_offset` (`:203-205`), `TimeTypesTimestampHelper#time_with_offset` (`:221-223`), `TimeTypesBaseTimeLikeHelper#time_with_offset` (`:235-237`)
- `Assertions#assert_equal_with_offset_and_timezone_offset` (`:505-509`)

## Acceptance criteria

- [ ] Each member above is ported at its Ruby name in `test/support/test-utils.ts` once `tzinfo-with-offset-classes` lands. Each one builds `X.new(...).set_timezone_offset(period)` as Ruby does.
