---
title: "Port LinkedTimezone and TimezoneProxy"
status: draft
updated: 2026-11-10
rfc: "0231-tzinfo-to-parity"
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

No TS files for `vendor/tzinfo/v2.0.6/lib/tzinfo/linked_timezone.rb` (5) or
`timezone_proxy.rb` (9). `info_timezone.rb` and `data_timezone.rb`, and their
tests `tc_info_timezone.rb` and `tc_data_timezone.rb`, are owned by
`tzinfo-data-timezone-is-a-real-subclass` (RFC
`0223-package-layout-mirrors-a-rails-gem`). `LinkedTimezone` subclasses
`InfoTimezone`, so this story builds on that one. Tests:
`tc_linked_timezone.rb`, `tc_timezone_proxy.rb`.

## Acceptance criteria

- [ ] `LinkedTimezone` (an `InfoTimezone`) and `TimezoneProxy` (a `Timezone`)
      are ported with every member.
- [ ] The two test files are ported by name.
