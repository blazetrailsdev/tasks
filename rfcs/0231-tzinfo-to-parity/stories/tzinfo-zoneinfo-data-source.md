---
title: "Port ZoneinfoDataSource"
status: draft
updated: 2026-11-09
rfc: "0231-tzinfo-to-parity"
cluster: null
packages:
  - "tzinfo"
deps:
  - "tzinfo-zoneinfo-reader-and-posix-parser"
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

`vendor/tzinfo/v2.0.6/lib/tzinfo/data_sources/zoneinfo_data_source.rb` (20: `search_path(=)`,
`alternate_iso3166_tab_search_path(=)`, `find_zoneinfo_dir`,
`load_timezone_identifiers`, `load_countries`, `dms_to_rational`, …) has no TS
file. Test: `test/data_sources/tc_zoneinfo_data_source.rb`, over the fixture
tree `vendor/tzinfo/v2.0.6/test/zoneinfo/`.

## Acceptance criteria

- [ ] The file is ported; file reads go through ruby-compat's `File` / `Dir`.
- [ ] The test file is ported by name with its zoneinfo fixtures.
