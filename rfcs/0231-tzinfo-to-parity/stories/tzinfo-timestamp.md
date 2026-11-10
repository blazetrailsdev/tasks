---
title: "Port TZInfo::Timestamp instance surface and its tc_timestamp.rb tests"
status: in-progress
updated: 2026-11-10
rfc: "0231-tzinfo-to-parity"
cluster: null
packages:
  - "tzinfo"
deps:
  - "tzinfo-parity-test-credits-tc-files"
deps-rfc: []
est-loc: 600
priority: 2
pr: trails#9960
claim: "2026-11-10T16:24:38Z"
assignee: "tzinfo-timestamp"
blocked-by: null
closed-reason: null
---

## Context

`vendor/tzinfo/v2.0.6/lib/tzinfo/timestamp.rb` (27 members: `Timestamp.create`, `for`, `utc`,
`new!`, `for_time`, `for_datetime`, `for_timestamp`, `for_time_like`,
`#value`, `#sub_second`, `#utc_offset`, `#utc?`, `#to_time`, `#to_datetime`,
`#strftime`, `#to_s`, `#eql?`, `#hash`, …) has no TS file
(`packages/tzinfo/lib/timestamp.ts`). Its test, `vendor/tzinfo/v2.0.6/test/tc_timestamp.rb`, is
unported. Every period and transition class reads `Timestamp`, so it comes first.

## Acceptance criteria

- [ ] `packages/tzinfo/lib/timestamp.ts` ports the constructor, `initialize!`, `new!`, `Timestamp.utc`
      and every instance member at their Ruby names.
- [ ] `test/timestamp.test.ts` ports `tc_timestamp.rb`'s tests for those members by name.
- `Timestamp.create`, `Timestamp.for` and its `for_*` helpers, with their tests, are
  `tzinfo-timestamp-create-and-for` (split at the PR LOC ceiling).
