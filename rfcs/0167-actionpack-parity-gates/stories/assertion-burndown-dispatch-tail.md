---
title: "Converge the actiondispatch assertion-mismatch tail"
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

- `vendor/rails/v8.0.2/actionpack/test/dispatch/routing/route_set_test.rb:1-204` → `packages/actionpack/src/action-dispatch/dispatch/routing/route-set.test.ts`: assert 6, kind 7, value 5, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/dispatch/request/multipart_params_parsing_test.rb:1-215` → `packages/actionpack/src/action-dispatch/dispatch/request/multipart-params-parsing.test.ts`: assert 13, kind 0, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/dispatch/uploaded_file_test.rb:1-142` → `packages/actionpack/src/action-dispatch/dispatch/uploaded-file.test.ts`: assert 0, kind 4, value 4, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/dispatch/system_testing/screenshot_helper_test.rb:1-197` → `packages/actionpack/src/action-dispatch/dispatch/system-testing/screenshot-helper.test.ts`: assert 2, kind 14, value 0, unmapped 1
- `vendor/rails/v8.0.2/actionpack/test/dispatch/request/session_test.rb:1-229` → `packages/actionpack/src/action-dispatch/dispatch/request/session.test.ts`: assert 1, kind 4, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/dispatch/test_response_test.rb:1-73` → `packages/actionpack/src/action-dispatch/dispatch/test-response.test.ts`: assert 1, kind 3, value 0, unmapped 2
- `vendor/rails/v8.0.2/actionpack/test/dispatch/param_builder_test.rb:1-71` → `packages/actionpack/src/action-dispatch/dispatch/param-builder.test.ts`: assert 2, kind 2, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/dispatch/actionable_exceptions_test.rb:1-94` → `packages/actionpack/src/action-dispatch/dispatch/actionable-exceptions.test.ts`: assert 0, kind 3, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/dispatch/system_testing/server_test.rb:1-32` → `packages/actionpack/src/action-dispatch/dispatch/system-testing/server.test.ts`: assert 0, kind 2, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/dispatch/static_test.rb:1-361` → `packages/actionpack/src/action-dispatch/dispatch/static.test.ts`: assert 0, kind 2, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/dispatch/permissions_policy_test.rb:1-260` → `packages/actionpack/src/action-dispatch/dispatch/permissions-policy.test.ts`: assert 1, kind 1, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/dispatch/test_request_test.rb:1-128` → `packages/actionpack/src/action-dispatch/dispatch/test-request.test.ts`: assert 0, kind 1, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/dispatch/session/test_session_test.rb:1-83` → `packages/actionpack/src/action-dispatch/dispatch/session/test-session.test.ts`: assert 0, kind 1, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/dispatch/routing_assertions_test.rb:1-396` → `packages/actionpack/src/action-dispatch/dispatch/routing-assertions.test.ts`: assert 1, kind 0, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/dispatch/routing/concerns_test.rb:1-114` → `packages/actionpack/src/action-dispatch/dispatch/routing/concerns.test.ts`: assert 0, kind 1, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/dispatch/request/url_encoded_params_parsing_test.rb:1-181` → `packages/actionpack/src/action-dispatch/dispatch/request/url-encoded-params-parsing.test.ts`: assert 1, kind 0, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/dispatch/request/query_string_parsing_test.rb:1-183` → `packages/actionpack/src/action-dispatch/dispatch/request/query-string-parsing.test.ts`: assert 1, kind 0, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/dispatch/request/json_params_parsing_test.rb:1-215` → `packages/actionpack/src/action-dispatch/dispatch/request/json-params-parsing.test.ts`: assert 1, kind 0, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/dispatch/mount_test.rb:1-110` → `packages/actionpack/src/action-dispatch/dispatch/mount.test.ts`: assert 1, kind 0, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/dispatch/mapper_test.rb:1-230` → `packages/actionpack/src/action-dispatch/dispatch/mapper.test.ts`: assert 0, kind 1, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/dispatch/header_test.rb:1-169` → `packages/actionpack/src/action-dispatch/dispatch/header.test.ts`: assert 0, kind 1, value 0, unmapped 0
- `vendor/rails/v8.0.2/actionpack/test/assertions/response_assertions_test.rb:1-154` → `packages/actionpack/src/action-dispatch/assertions/response-assertions.test.ts`: assert 11, kind 10, value 0, unmapped 10

## Acceptance criteria

- Re-measure each file with `pnpm parity:test:assertions`; counts will have moved as sibling ports land.
- Each mismatch that is a real divergence (trails asserting less, or a different kind or value, than Rails) is converged by porting the Rails assertion.
- A mismatch caused by an unmapped assertion helper is left to the mapping story, not worked around in the test.
- `pnpm parity:test:assertions` shows 0 divergence rows for these files, and the marks in `scripts/test-compare/assertion-mismatch-mark.json` are tightened.
