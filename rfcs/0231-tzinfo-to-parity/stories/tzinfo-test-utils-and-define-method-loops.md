---
title: "tzinfo-test-utils-and-define-method-loops"
status: draft
updated: 2026-11-10
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

`tzinfo-parity-test-credits-tc-files` removed `scripts/parity/unported-files/tzinfo.ts`
(51 NOT_YET_PORTED rows), so `pnpm parity:test --package tzinfo` now reports
`0/961 tests | 0/51 files`. Its remaining acceptance criteria did not fit the PR:

- `vendor/tzinfo/v2.0.6/test/test_utils.rb` (544 lines: the shared assertions and
  fixture helpers every `tc_*.rb` uses) has no port. It goes at
  `packages/tzinfo/test/support/test-utils.ts`.
- `extract-ruby-tests.rb:2938-2941` prints 45 tzinfo `define_method` loops as
  "not statically expandable" with only their locations. Each needs expanding in
  the extractor or a listed reason, as other packages' are.
- The `ts_all*.rb` suite runners define no tests; confirm the comparer does not
  count them (`extract-ruby-tests.rb:2850-2853`).

## Acceptance criteria

- [ ] `packages/tzinfo/test/support/test-utils.ts` ports `test_utils.rb` at its Ruby names.
- [ ] The 45 loops are expanded or listed with a reason.
- [ ] `ts_all*.rb` is not counted, with a test in `scripts/test-compare/`.
