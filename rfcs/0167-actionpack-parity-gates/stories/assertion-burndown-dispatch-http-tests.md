---
title: "Converge CSP, response, cookie-store and mime-type test assertion mismatches"
status: draft
updated: 2026-10-17
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Filed by `triage-actionpack-assertion-mismatches` from `pnpm parity:test:assertions` on trails `main` @ `94b071b93d` (2026-10-17). Counts are the number of matched tests per file with a mismatch: `assert` = assertion count, `kind` = assertion-kind multiset, `value` = asserted literal values (`scripts/test-compare/output/convention-comparison.json`). `unmapped` is how many kind rows involve an assertion test-compare does not map; those are tooling gaps tracked by `assertion-kinds-map-actionpack-test-assertions`, not divergence.

- `vendor/rails/v8.0.2/actionpack/test/dispatch/content_security_policy_test.rb:1-836` → `packages/actionpack/src/action-dispatch/dispatch/content-security-policy.test.ts`: assert 18, kind 27, value 4, unmapped 9
- `vendor/rails/v8.0.2/actionpack/test/dispatch/session/cookie_store_test.rb:1-471` → `packages/actionpack/src/action-dispatch/dispatch/session/cookie-store.test.ts`: assert 19, kind 22, value 5, unmapped 15
- `vendor/rails/v8.0.2/actionpack/test/dispatch/response_test.rb:1-650` → `packages/actionpack/src/action-dispatch/dispatch/response.test.ts`: assert 15, kind 20, value 6, unmapped 3
- `vendor/rails/v8.0.2/actionpack/test/dispatch/mime_type_test.rb:1-284` → `packages/actionpack/src/action-dispatch/dispatch/mime-type.test.ts`: assert 8, kind 12, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/dispatch/cookies_test.rb:1-1675` → `packages/actionpack/src/action-dispatch/dispatch/cookies.test.ts`: assert 4, kind 6, value 1, unmapped 0

## Acceptance criteria

- Re-measure each file with `pnpm parity:test:assertions`; counts will have moved as sibling ports land.
- Each mismatch that is a real divergence (trails asserting less, or a different kind or value, than Rails) is converged by porting the Rails assertion.
- A mismatch caused by an unmapped assertion helper is left to the mapping story, not worked around in the test.
- `pnpm parity:test:assertions` shows 0 divergence rows for these files, and the marks in `scripts/test-compare/assertion-mismatch-mark.json` are tightened.
