---
title: "Port TZInfo::DataSource and its info classes"
status: done
updated: 2026-11-13
rfc: "0231-tzinfo-to-parity"
cluster: null
packages:
  - "tzinfo"
deps:
  - "tzinfo-offset-transition-and-periods"
deps-rfc: []
est-loc: 650
priority: 5
pr: trails#10065
claim: "2026-11-13T17:49:47Z"
assignee: "tzinfo-data-source-base"
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

- [ ] The six files are ported with every member. `DataSource.get` / `set`
      work with an explicitly set source; `create_default_data_source` is ported
      but its selection test lands in `tzinfo-timezone-reads-the-data-source`,
      once both concrete sources exist.
- [ ] Their test files are ported by name, except the `tc_data_source.rb`
      examples that need `RubyDataSource` or `ZoneinfoDataSource`, which move
      with that selection test.
