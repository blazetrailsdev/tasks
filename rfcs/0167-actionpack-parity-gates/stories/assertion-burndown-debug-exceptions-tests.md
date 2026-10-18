---
title: "Converge debug-exceptions test assertion mismatches"
status: in-progress
updated: 2026-10-18
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 1300
priority: null
pr: trails#9034
claim: "2026-10-18T17:32:11Z"
assignee: "assertion-burndown-debug-exceptions-tests"
blocked-by: null
closed-reason: null
---

## Context

Split out of `assertion-burndown-dispatch-middleware-tests`: the rest of that
story fit its PR, `debug_exceptions_test.rb` did not (over 300 Rails
assertions across 20 tests).

- `vendor/rails/v8.0.2/actionpack/test/dispatch/debug_exceptions_test.rb:1-910` →
  `packages/actionpack/src/action-dispatch/dispatch/debug-exceptions.test.ts`:
  on trails `main` @ `457ef1e4e9`, 13 assertion-count, 20 kind and 3 value
  mismatches (`pnpm parity:test:assertions`). The worst are "rescue with
  diagnostics message" (Rails 21 / trails 4), "rescue with text error for xhr
  request" (28/3), "rescue with JSON error for JSON API request" (29/5) and
  "logs exception causes" (13/1): Rails asserts `assert_match` /
  `assert_no_match` on the body where trails uses a few `toContain`.
- 17 kind rows also involve `assert_response` / `assert_select`, which
  test-compare does not map (`assertion-kinds-map-actionpack-test-assertions`).

## Acceptance criteria

- Each real divergence in `debug-exceptions.test.ts` is converged by porting
  the Rails assertion (`assert_match` → `toMatch`, `assert_no_match` →
  `not.toMatch`, `assert_nothing_raised` → `assertNothingRaised`, ...).
- Unmapped-helper rows are left to the mapping story.
- `pnpm parity:test:assertions` shows 0 divergence rows for the file, and
  `scripts/test-compare/assertion-mismatch-mark.json` is tightened.
