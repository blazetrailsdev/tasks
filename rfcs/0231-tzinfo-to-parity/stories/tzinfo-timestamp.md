---
title: "Port TZInfo::Timestamp and tc_timestamp.rb"
status: draft
updated: 2026-11-09
rfc: "0231-tzinfo-to-parity"
cluster: null
packages:
  - "tzinfo"
deps:
  - "tzinfo-parity-test-credits-tc-files"
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
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

- [ ] `packages/tzinfo/lib/timestamp.ts` ports all 27 members at their Ruby names.
- [ ] `test/timestamp.test.ts` ports `tc_timestamp.rb` by name.
