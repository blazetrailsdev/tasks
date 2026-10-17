---
title: "Map actionpack test assertions in assertion-kinds"
status: draft
updated: 2026-10-17
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Filed by `triage-actionpack-assertion-mismatches` (2026-10-17, trails `main` @ `94b071b93d`). In actiondispatch, actioncontroller and abstractcontroller, the kind-mismatch rows that involve an assertion `scripts/test-compare/assertion-kinds.ts` does not map are a mapping gap, not a divergence. Counted over every kind row's `railsUnmapped` / `trailsUnmapped` in `scripts/test-compare/output/convention-comparison.json`:

- `assert_response` 70 (Rails side), `assertResponse` 8 (trails side): `vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/assertions/response.rb:33-44`
- `assert_redirected_to` 4, `assertRedirectedTo` 1: `response.rb:62-72`
- `assert_policy` 9 (a private helper in `vendor/rails/v8.0.2/actionpack/test/dispatch/content_security_policy_test.rb`)
- `assert_session_cookie` 6, `assert_set_cookie_header` 2, `assert_set_cookie_attributes` 2, `assert_not_set_cookie_attributes` 1 (private helpers in the cookie tests)
- `assert_difference` 4, `assert_no_difference` 1, `assert_called_with` 3, `assert_pattern` 2, `assert_select` 3, `assert_generates` 1, `assert_params` 1, `assert_headers` 1
- trails side: `toHaveProperty` 1, `toHaveBeenCalled` 1

## Acceptance criteria

- Each Rails assertion above is either mapped to its kind in `assertion-kinds.ts`, or, for a private test helper, folded through as the assertions its body makes (as same-file helpers already are).
- The trails spellings (`assertResponse`, `assertRedirectedTo`) map to the same kind as their Rails names.
- `toHaveProperty` / `toHaveBeenCalled` map to the kinds of the Rails assertions they stand for, or the test is changed to use the Rails assertion.
- Re-running `pnpm parity:test:assertions` shows no `railsUnmapped` / `trailsUnmapped` entries for these names in the three packages, and the assertion-mismatch marks are tightened.
