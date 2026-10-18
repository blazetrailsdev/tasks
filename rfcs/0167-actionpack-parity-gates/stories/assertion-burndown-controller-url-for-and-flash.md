---
title: "Converge url_for, flash and flash_hash test assertion mismatches"
status: done
updated: 2026-10-18
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: trails#9018
claim: "2026-10-17T23:44:50Z"
assignee: "assertion-burndown-controller-url-for-and-flash"
blocked-by: null
closed-reason: null
---

## Context

Filed by `triage-actionpack-assertion-mismatches` from `pnpm parity:test:assertions` on trails `main` @ `94b071b93d` (2026-10-17). Counts are the number of matched tests per file with a mismatch: `assert` = assertion count, `kind` = assertion-kind multiset, `value` = asserted literal values (`scripts/test-compare/output/convention-comparison.json`). `unmapped` is how many kind rows involve an assertion test-compare does not map; those are tooling gaps tracked by `assertion-kinds-map-actionpack-test-assertions`, not divergence.

- `vendor/rails/v8.0.2/actionpack/test/controller/url_for_test.rb:1-604` → `packages/actionpack/src/action-controller/controller/url-for.test.ts`: assert 14, kind 20, value 17, unmapped 1
- `vendor/rails/v8.0.2/actionpack/test/controller/flash_hash_test.rb:1-216` → `packages/actionpack/src/action-controller/controller/flash-hash.test.ts`: assert 11, kind 12, value 2, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/controller/flash_test.rb:1-403` → `packages/actionpack/src/action-controller/controller/flash.test.ts`: assert 8, kind 8, value 2, unmapped 0

## Acceptance criteria

- Re-measure each file with `pnpm parity:test:assertions`; counts will have moved as sibling ports land.
- Each mismatch that is a real divergence (trails asserting less, or a different kind or value, than Rails) is converged by porting the Rails assertion.
- A mismatch caused by an unmapped assertion helper is left to the mapping story, not worked around in the test.
- `pnpm parity:test:assertions` shows 0 divergence rows for these files, and the marks in `scripts/test-compare/assertion-mismatch-mark.json` are tightened.
