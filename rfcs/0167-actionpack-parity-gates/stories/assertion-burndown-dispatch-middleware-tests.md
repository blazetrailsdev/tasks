---
title: "Converge debug-exceptions, exception-wrapper and middleware-stack test assertion mismatches"
status: claimed
updated: 2026-10-18
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: "2026-10-18T00:44:52Z"
assignee: "core-exception-classes-are-registered-constants"
blocked-by: null
closed-reason: null
---

## Context

Filed by `triage-actionpack-assertion-mismatches` from `pnpm parity:test:assertions` on trails `main` @ `94b071b93d` (2026-10-17). Counts are the number of matched tests per file with a mismatch: `assert` = assertion count, `kind` = assertion-kind multiset, `value` = asserted literal values (`scripts/test-compare/output/convention-comparison.json`). `unmapped` is how many kind rows involve an assertion test-compare does not map; those are tooling gaps tracked by `assertion-kinds-map-actionpack-test-assertions`, not divergence.

- `vendor/rails/v8.0.2/actionpack/test/dispatch/debug_exceptions_test.rb:1-910` → `packages/actionpack/src/action-dispatch/dispatch/debug-exceptions.test.ts`: assert 13, kind 20, value 3, unmapped 17
- `vendor/rails/v8.0.2/actionpack/test/dispatch/exception_wrapper_test.rb:1-280` → `packages/actionpack/src/action-dispatch/dispatch/exception-wrapper.test.ts`: assert 9, kind 7, value 0, unmapped 1
- `vendor/rails/v8.0.2/actionpack/test/dispatch/middleware_stack_test.rb:1-218` → `packages/actionpack/src/action-dispatch/dispatch/middleware-stack.test.ts`: assert 7, kind 10, value 0, unmapped 5
- `vendor/rails/v8.0.2/actionpack/test/dispatch/request_id_test.rb:1-102` → `packages/actionpack/src/action-dispatch/dispatch/request-id.test.ts`: assert 3, kind 6, value 3, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/dispatch/reloader_test.rb:1-145` → `packages/actionpack/src/action-dispatch/dispatch/reloader.test.ts`: assert 3, kind 6, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/dispatch/executor_test.rb:1-188` → `packages/actionpack/src/action-dispatch/dispatch/executor.test.ts`: assert 0, kind 7, value 0, unmapped 0

## Acceptance criteria

- Re-measure each file with `pnpm parity:test:assertions`; counts will have moved as sibling ports land.
- Each mismatch that is a real divergence (trails asserting less, or a different kind or value, than Rails) is converged by porting the Rails assertion.
- A mismatch caused by an unmapped assertion helper is left to the mapping story, not worked around in the test.
- `pnpm parity:test:assertions` shows 0 divergence rows for these files, and the marks in `scripts/test-compare/assertion-mismatch-mark.json` are tightened.
