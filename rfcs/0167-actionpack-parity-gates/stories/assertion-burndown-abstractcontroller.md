---
title: "Converge abstractcontroller test assertion mismatches"
status: done
updated: 2026-10-18
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: trails#9017
claim: "2026-10-17T23:43:45Z"
assignee: "stub-const-awaits-an-async-block"
blocked-by: null
closed-reason: null
---

## Context

Filed by `triage-actionpack-assertion-mismatches` from `pnpm parity:test:assertions` on trails `main` @ `94b071b93d` (2026-10-17). Counts are the number of matched tests per file with a mismatch: `assert` = assertion count, `kind` = assertion-kind multiset, `value` = asserted literal values (`scripts/test-compare/output/convention-comparison.json`). `unmapped` is how many kind rows involve an assertion test-compare does not map; those are tooling gaps tracked by `assertion-kinds-map-actionpack-test-assertions`, not divergence.

- `vendor/rails/v8.0.2/actionpack/test/abstract/callbacks_test.rb:1-497` → `packages/actionpack/src/abstract-controller/callbacks.test.ts`: assert 3, kind 9, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/abstract/translation_test.rb:1-182` → `packages/actionpack/src/abstract-controller/translation.test.ts`: assert 2, kind 6, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/abstract/collector_test.rb:1-65` → `packages/actionpack/src/abstract-controller/collector.test.ts`: assert 0, kind 3, value 0, unmapped 0

## Acceptance criteria

- Re-measure each file with `pnpm parity:test:assertions`; counts will have moved as sibling ports land.
- Each mismatch that is a real divergence (trails asserting less, or a different kind or value, than Rails) is converged by porting the Rails assertion.
- A mismatch caused by an unmapped assertion helper is left to the mapping story, not worked around in the test.
- `pnpm parity:test:assertions` shows 0 divergence rows for these files, and the marks in `scripts/test-compare/assertion-mismatch-mark.json` are tightened.
