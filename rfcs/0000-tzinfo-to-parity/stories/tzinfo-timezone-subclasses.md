---
title: "Port InfoTimezone, LinkedTimezone and TimezoneProxy"
status: draft
updated: 2026-11-09
rfc: "0000-tzinfo-to-parity"
cluster: null
packages:
  - "tzinfo"
deps:
  - "tzinfo-data-timezone-is-a-real-subclass"
  - "tzinfo-data-source-base"
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

No TS files for `vendor/tzinfo/v2.0.6/lib/tzinfo/info_timezone.rb` (3), `linked_timezone.rb` (5),
`timezone_proxy.rb` (9); `data_timezone.rb` (4) is owned by
`tzinfo-data-timezone-is-a-real-subclass` (0223), which this story builds on.
Tests: `tc_info_timezone.rb`, `tc_linked_timezone.rb`, `tc_timezone_proxy.rb`,
`tc_data_timezone.rb`.

## Acceptance criteria

- [ ] The three classes are ported as `Timezone` subclasses with every member.
- [ ] The four test files are ported by name.
