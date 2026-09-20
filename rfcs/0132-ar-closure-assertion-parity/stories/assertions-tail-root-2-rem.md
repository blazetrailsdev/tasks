---
title: "assertions-tail-root-2-rem"
status: claimed
updated: 2026-09-20
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: "2026-09-20T18:48:15Z"
assignee: "assertions-tail-root-2-rem"
blocked-by: null
closed-reason: null
---

## Context

Remainder of assertions-tail-root-2 (RFC 0132). The first PR converged relation/mutation*test.rb's order!/reorder!/reverse_order!/skip*\* tests (`.equal?` maps to truthy, so `expect(x === rel).toBeTruthy()`). Residue re-measured with `pnpm parity:test -- --package activerecord --assertions --missing`: mutation_test.rb (`#!`, `#_select!`, `extending!`, `#reorder!`, `none!`, plus order!/reorder! symbol tests whose value is "posts" in Rails but Post has no `name` column so the port uses Developer), invertible_migration_test.rb, store_test.rb, active_record_schema_test.rb, readonly_test.rb, database_selector_test.rb, encryption/encryptable_record_api_test.rb, date_time_precision_test.rb, attributes_test.rb — all untouched.

## Acceptance criteria

Every listed file reports 0 count/kind/value mismatches; no test renames; mark file frozen.
