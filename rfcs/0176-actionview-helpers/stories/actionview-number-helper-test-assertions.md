---
title: "actionview-number-helper-test-assertions"
status: in-progress
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9199
claim: "2026-10-21T22:29:25Z"
assignee: "actionview-api-residue-context-rendering-class-methods"
blocked-by: null
closed-reason: null
---

# actionview number_helper_test assertion convergence

## Context

`pnpm parity:test --package actionview --assertions --missing` (2026-10-21) reports 9 count and 9 kind mismatches in `template/number_helper_test.rb` → `packages/actionview/src/template/number-helper.test.ts`. Classified as **real misses**: the port drops Rails assertions. E.g. `test_number_to_percentage` (`vendor/rails/v8.0.2/actionview/test/template/number_helper_test.rb:29-45`) has 14 `assert_equal`s; the port keeps 6, dropping the `delimiter:`/`separator:`, `Float::NAN` and `Float::INFINITY` arms. `number helpers outputs are html safe` ports 24 `assert ...html_safe?` / 6 `assert_not` as 5 `toBe` equals; `should raise error if invalid when specified` ports 7 `assert_raise`s as 1.

## Acceptance criteria

- Every Rails assertion in the 9 flagged tests is ported, in order, with its Rails kind (`assert` → truthy, `assert_not` → falsy, `assert_raise` per call).
- A dropped one that is genuinely unportable carries a row in `scripts/test-compare/assertion-receipts.ts` citing the ratified section.
- number_helper_test.rb shows 0 count and 0 kind mismatches.
