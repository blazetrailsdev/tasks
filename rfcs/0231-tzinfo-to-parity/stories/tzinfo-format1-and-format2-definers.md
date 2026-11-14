---
title: "Port the Format1 and Format2 definer and definition modules"
status: in-progress
updated: 2026-11-14
rfc: "0231-tzinfo-to-parity"
cluster: null
packages:
  - "tzinfo"
deps:
  - "tzinfo-data-source-base"
deps-rfc: []
est-loc: 450
priority: 6
pr: trails#10078
claim: "2026-11-14T00:30:57Z"
assignee: "tzinfo-format1-and-format2-definers"
blocked-by: null
closed-reason: null
---

## Context

No TS files under `vendor/tzinfo/v2.0.6/lib/tzinfo/format1/` (country_definer, country_index_definition,
timezone_definer, timezone_definition, timezone_index_definition: 10 members) or
`format2/` (country_definer, country_index_definer, country_index_definition,
timezone_definer, timezone_definition, timezone_index_definer,
timezone_index_definition: 27 members). These are the DSL tzinfo-data's Ruby
modules call. Tests: `vendor/tzinfo/v2.0.6/test/format1/`, `vendor/tzinfo/v2.0.6/test/format2/`.

## Acceptance criteria

- [ ] Both directories are ported file for file.
- [ ] Their tests are ported by name.
