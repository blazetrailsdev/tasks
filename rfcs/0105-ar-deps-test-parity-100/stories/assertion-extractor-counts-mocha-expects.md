---
title: "assertion-extractor-counts-mocha-expects"
status: done
updated: 2026-08-22
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6847
claim: "2026-08-21T23:10:30Z"
assignee: "assertions-tail-root-6a"
blocked-by: null
closed-reason: null
---

## Context

Six i18n tests are the last assertion-count divergences in the package after
`assertions-i18n-cluster` (56 -> 6). All six are one shape: the Rails test
verifies a call with mocha's `expects`, which is a mock expectation verified at
teardown and therefore counts as **zero** minitest assertions, while the trails
port spells the same check as an explicit `expect(spy).toHaveBeenCalledWith(...)`
— one assertion.

Measured 2026-08-18 (`pnpm parity:test -- --assertions --missing --package i18n`):

- `i18n_test.rb › uses a custom exception handler set to I18n.exception_handler` — rails 0 vs trails 1
- `i18n_test.rb › uses a custom exception handler passed as an option` — rails 0 vs trails 1
- `i18n_test.rb › delegates translate calls to the backend` — rails 0 vs trails 1
- `i18n_test.rb › delegates localize calls to the backend` — rails 0 vs trails 1
- `i18n_test.rb › translate given no locale uses the current locale` — rails 0 vs trails 1
- `backend/chain_test.rb › store_translations options are not dropped while transferring to backend` — rails 0 vs trails 1

Rails sources: `vendor/i18n/test/i18n_test.rb:156-185`,
`vendor/i18n/test/backend/chain_test.rb:81-84`.

Loosening the trails side is not an option — dropping the assertion would leave
the test verifying nothing. The fix belongs in the extractor: count a mocha
`expects(...)`/`.with(...)` chain on the Rails side as an assertion, the way
`scripts/test-compare/assertion-kinds.ts` already normalizes minitest names.
That would also close the same shape wherever else a Rails suite mocks.

## Acceptance criteria

- The Rails-side assertion extractor counts mocha `expects` expectations, with a
  canonical kind that the trails `toHaveBeenCalled`/`toHaveBeenCalledWith`
  matchers map onto.
- The six tests above report 0 assertion-count and 0 assertion-kind mismatches.
- `scripts/test-compare/assertion-mismatch-mark.json` lowered on a passing run;
  no counter lowered by narrowing a report scope or dropping a package.
