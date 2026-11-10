---
title: "Port ZoneinfoReader and PosixTimeZoneParser"
status: draft
updated: 2026-11-09
rfc: "0231-tzinfo-to-parity"
cluster: null
packages:
  - "tzinfo"
deps:
  - "tzinfo-transition-rule-and-annual-rules"
  - "tzinfo-data-source-base"
deps-rfc: []
est-loc: 650
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/tzinfo/v2.0.6/lib/tzinfo/data_sources/zoneinfo_reader.rb` (13: TZif v1-v3 parsing,
`derive_offsets`, `apply_rules_with_transitions`, …) and
`posix_time_zone_parser.rb` (6) have no TS files. Tests:
`test/data_sources/tc_zoneinfo_reader.rb`, `tc_posix_time_zone_parser.rb`.
The reader takes bytes, which are a `Uint8Array` by CLAUDE.md § "A String has
no encoding tag either".

## Acceptance criteria

- [ ] Both files are ported, reading TZif bytes as a `Uint8Array`.
- [ ] Both test files are ported by name.
