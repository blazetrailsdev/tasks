---
title: "tzinfo-format2-definition-tests"
status: draft
updated: 2026-11-20
rfc: "0231-tzinfo-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`tzinfo-format1-and-format2-definition-modules` ported all of `vendor/tzinfo/v2.0.6/lib/tzinfo/format1/` with its `test/format1/*.rb`. The Format2 definition modules (`packages/tzinfo/lib/format2/{country-index,timezone,timezone-index}-definition.ts`) were already ported, but their tests are not:

- `vendor/tzinfo/v2.0.6/test/format2/tc_country_index_definition.rb` (4 tests)
- `vendor/tzinfo/v2.0.6/test/format2/tc_timezone_definition.rb` (13 tests)
- `vendor/tzinfo/v2.0.6/test/format2/tc_timezone_index_definition.rb`

`pnpm parity:test --assertions --package tzinfo` lists them as missing. `ConcurrentStringDeduper` (`vendor/tzinfo/v2.0.6/lib/tzinfo/string_deduper.rb:47-57`) is also still unported. The Format1 tests in `packages/tzinfo/test/format1/*-definition.test.ts` show the pattern: `include({}, Mod)`, then direct ClassMethods calls.

## Acceptance criteria

- [ ] `packages/tzinfo/test/format2/{country-index,timezone,timezone-index}-definition.test.ts` port the three Rails test files by name.
- [ ] `ConcurrentStringDeduper` is ported at `string-deduper.ts` with its `tc_string_deduper.rb` tests.
