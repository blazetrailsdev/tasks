---
title: "Port TZInfo::DataSource and its info classes"
status: draft
updated: 2026-11-09
rfc: "0000-tzinfo-to-parity"
cluster: null
packages:
  - "tzinfo"
deps:
  - "tzinfo-offset-transition-and-periods"
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

`vendor/tzinfo/v2.0.6/lib/tzinfo/data_source.rb` (21: `DataSource.get`, `set`,
`create_default_data_source`, `#get_timezone_info`, `#timezone_identifiers`,
`#get_country_info`, `#eager_load!`, `#validate_timezone_identifier`, …) has no
TS file. Nor do `data_sources/timezone_info.rb` (4), `data_timezone_info.rb` (5),
`linked_timezone_info.rb` (3), `transitions_data_timezone_info.rb` (7),
`country_info.rb` (4); `constant_offset_data_timezone_info.rb` is 2/6. Tests:
`tc_data_source.rb`, `test/data_sources/tc_*_info.rb`.

## Acceptance criteria

- [ ] The six files are ported with every member; `DataSource.get` picks the
      default source by `create_default_data_source`'s order.
- [ ] Their test files are ported by name.
