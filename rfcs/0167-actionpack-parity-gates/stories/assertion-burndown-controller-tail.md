---
title: "Converge the actioncontroller assertion-mismatch tail"
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

- `vendor/rails/v8.0.2/actionpack/test/controller/filters_test.rb:1-1068` → `packages/actionpack/src/action-controller/controller/filters.test.ts`: assert 0, kind 22, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/controller/action_pack_assertions_test.rb:1-523` → `packages/actionpack/src/action-controller/controller/action-pack-assertions.test.ts`: assert 6, kind 22, value 0, unmapped 5
- `vendor/rails/v8.0.2/actionpack/test/controller/rescue_test.rb:1-364` → `packages/actionpack/src/action-controller/controller/rescue.test.ts`: assert 0, kind 17, value 4, unmapped 17
- `vendor/rails/v8.0.2/actionpack/test/controller/render_test.rb:1-1158` → `packages/actionpack/src/action-controller/controller/render.test.ts`: assert 0, kind 15, value 0, unmapped 7
- `vendor/rails/v8.0.2/actionpack/test/controller/render_json_test.rb:1-142` → `packages/actionpack/src/action-controller/controller/render-json.test.ts`: assert 5, kind 8, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/controller/allow_browser_test.rb:1-107` → `packages/actionpack/src/action-controller/controller/allow-browser.test.ts`: assert 3, kind 7, value 0, unmapped 6
- `vendor/rails/v8.0.2/actionpack/test/controller/base_test.rb:1-360` → `packages/actionpack/src/action-controller/controller/base.test.ts`: assert 3, kind 4, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/controller/parameters/dup_test.rb:1-67` → `packages/actionpack/src/action-controller/controller/parameters/dup.test.ts`: assert 0, kind 5, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/controller/request_forgery_protection_test.rb:1-1435` → `packages/actionpack/src/action-controller/controller/request-forgery-protection.test.ts`: assert 0, kind 4, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/controller/integration_test.rb:1-1396` → `packages/actionpack/src/action-controller/controller/integration.test.ts`: assert 1, kind 3, value 0, unmapped 1
- `vendor/rails/v8.0.2/actionpack/test/controller/parameters/serialization_test.rb:1-57` → `packages/actionpack/src/action-controller/controller/parameters/serialization.test.ts`: assert 0, kind 3, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/controller/parameters/always_permitted_parameters_test.rb:1-30` → `packages/actionpack/src/action-controller/controller/parameters/always-permitted-parameters.test.ts`: assert 1, kind 2, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/controller/test_case_test.rb:1-1294` → `packages/actionpack/src/action-controller/controller/test-case.test.ts`: assert 1, kind 1, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/controller/show_exceptions_test.rb:1-114` → `packages/actionpack/src/action-controller/controller/show-exceptions.test.ts`: assert 1, kind 0, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/controller/routing_test.rb:1-2196` → `packages/actionpack/src/action-controller/controller/routing.test.ts`: assert 0, kind 1, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/controller/parameters/raise_on_unpermitted_params_test.rb:1-57` → `packages/actionpack/src/action-controller/controller/parameters/raise-on-unpermitted-params.test.ts`: assert 1, kind 0, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/controller/parameters/multi_parameter_attributes_test.rb:1-39` → `packages/actionpack/src/action-controller/controller/parameters/multi-parameter-attributes.test.ts`: assert 0, kind 1, value 0, unmapped 0

## Acceptance criteria

- Re-measure each file with `pnpm parity:test:assertions`; counts will have moved as sibling ports land.
- Each mismatch that is a real divergence (trails asserting less, or a different kind or value, than Rails) is converged by porting the Rails assertion.
- A mismatch caused by an unmapped assertion helper is left to the mapping story, not worked around in the test.
- `pnpm parity:test:assertions` shows 0 divergence rows for these files, and the marks in `scripts/test-compare/assertion-mismatch-mark.json` are tightened.
