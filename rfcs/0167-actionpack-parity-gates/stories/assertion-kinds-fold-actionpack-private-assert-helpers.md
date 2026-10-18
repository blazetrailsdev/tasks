---
title: "assertion-kinds-fold-actionpack-private-assert-helpers"
status: ready
updated: 2026-10-18
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left over from `assertion-kinds-map-actionpack-test-assertions`. That PR mapped the
ActionDispatch / rails-dom-testing / Minitest assertions (`assert_response`,
`assert_redirected_to`, `assert_generates`, `assert_select`, `assert_pattern`,
`assert_headers`) in `scripts/test-compare/assertion-kinds.ts`. Two groups were not
landed, because each turned hundreds of unmapped rows into false divergent rows across
other packages:

- **Same-file `assert_*` private helpers** (`assert_policy`,
  `vendor/rails/v8.0.2/actionpack/test/dispatch/content_security_policy_test.rb:440,631`;
  `assert_session_cookie`, `assert_set_cookie_header`, `assert_set_cookie_attributes`,
  `assert_not_set_cookie_attributes` in the cookie tests; `assert_params`,
  `vendor/rails/v8.0.2/actionpack/test/dispatch/routing_test.rb:5123`). Both extractors
  (`assertion_method?` in `scripts/test-compare/extract-ruby-tests.rb:125`,
  `isAssertionCallee` in `scripts/test-compare/extract-ts-core.ts:38`) count an
  `assert*`-named call as one assertion before trying helper expansion. Expanding a
  same-file `assert*` helper on both sides was tried: ratchet +94 kind rows in
  activerecord, +80 in actionview, +63 in actioncontroller, because the Ruby helper is
  same-file where the trails port imports it (or the reverse), so one side folds and the
  other does not.
- **`assert_difference` / `assert_no_difference` / `assert_called_with` / `assert_called`**
  (`activesupport/lib/active_support/testing/assertions.rb:101-252`,
  `method_call_assertions.rb:9-60`). Mapping them to their own kinds gave +99
  `calledWith` and +24 `difference` kind rows in activerecord, where ports use vitest
  spies. `toHaveBeenCalled` / `toHaveProperty` (trails side) stay unmapped with them;
  `toHaveProperty` -> `respondTo` reds `date`'s `test_date_parse.rb` "parse too long year".

## Acceptance criteria

- Expansion of a same-file `assert*` helper is symmetric: a helper folds only where both
  sides define it in the test file, or the trails ports of these actionpack helpers are
  converged to same-file helpers so both fold.
- The activerecord ports that spy where Rails calls `assert_called_with` /
  `assert_difference` are converged (or receipted) so mapping those kinds does not grow
  the `assertion-mismatch` ratchet.
- `pnpm parity:test:assertions` shows no `railsUnmapped` / `trailsUnmapped` entry for the
  names above in actiondispatch, actioncontroller and abstractcontroller, and the marks
  are tightened.
