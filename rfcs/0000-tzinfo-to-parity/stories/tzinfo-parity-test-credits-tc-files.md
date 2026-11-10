---
title: "parity:test reports tzinfo's 961 Ruby tests instead of 0/0"
status: draft
updated: 2026-11-09
rfc: "0000-tzinfo-to-parity"
cluster: null
packages:
  - "tzinfo"
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test` (2026-11-09) extracts tzinfo's suite ("tzinfo: 51 files, 961
tests", 45 `define_method` loops not statically expandable) but its report line
is `tzinfo — 0/0 tests (0%) | 0/0 files`. The mapping exists
(`rubyToConventionTs` strips the `tc_` prefix, `scripts/test-compare/compare.ts:231`,
pinned by `compare.test.ts:210`) and `PKG_SRC_DIRS` has `tzinfo`
(`compare.ts:1756`), so the Ruby side is dropped somewhere between extraction and
the per-package result. Ruby tests: `vendor/tzinfo/v2.0.6/test/tc_*.rb`, `vendor/tzinfo/v2.0.6/test/data_sources/`,
`vendor/tzinfo/v2.0.6/test/format1/`, `vendor/tzinfo/v2.0.6/test/format2/`.

## Acceptance criteria

- [ ] `pnpm parity:test --package tzinfo` reports the extracted Ruby tests as the
      denominator, per file, with a regression test in `scripts/test-compare/`
      that fails on the current code.
- [ ] The 45 unexpandable `define_method` loops are expanded or listed with
      their reason, as other packages' are.
