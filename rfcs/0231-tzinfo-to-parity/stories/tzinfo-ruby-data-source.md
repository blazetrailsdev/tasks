---
title: "Port RubyDataSource over a generated tzinfo-data definition set"
status: ready
updated: 2026-11-10
rfc: "0231-tzinfo-to-parity"
cluster: null
packages:
  - "tzinfo"
deps:
  - "tzinfo-format1-and-format2-definers"
deps-rfc: []
est-loc: 600
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/tzinfo/v2.0.6/lib/tzinfo/data_sources/ruby_data_source.rb` (11: `require_definition`,
`require_index`, `require_data`, `version_info`, …) has no TS file. It loads
tzinfo-data's generated Ruby modules, which call the Format2 definers. Test:
`test/data_sources/tc_ruby_data_source.rb`, over `vendor/tzinfo/v2.0.6/test/tzinfo-data1/` and
`tzinfo-data2/`. This RFC's Open Questions rule that the definitions are
generated as TS modules by a build step and loaded by an awaited `import()`, as
CLAUDE.md § "An adapter file is loaded by an awaited step" does for adapters.

## Acceptance criteria

- [ ] `ruby-data-source.ts` ports the gem's body, `require_definition` mapping to
      an awaited `import()` of a generated module.
- [ ] A script generates the TS definition modules from the test fixtures (and,
      later, tzinfo-data) and its output is checked in for the fixtures.
- [ ] The test file is ported by name.
