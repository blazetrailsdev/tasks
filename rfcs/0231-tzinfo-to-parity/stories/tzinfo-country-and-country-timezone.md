---
title: "Port Country and CountryTimezone"
status: draft
updated: 2026-11-09
rfc: "0231-tzinfo-to-parity"
cluster: null
packages:
  - "tzinfo"
deps:
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

`vendor/tzinfo/v2.0.6/lib/tzinfo/country.rb` is 1/16 (`Country.get`, `all_codes`, `all`,
`#code`, `#zone_identifiers`, `#zones`, `#zone_info`, `_dump` / `_load`, …) and
`country_timezone.rb` 0/9 has no TS file. Tests: `tc_country.rb`,
`tc_country_timezone.rb`.

## Acceptance criteria

- [ ] Both files are ported with every member.
- [ ] Both test files are ported by name.
