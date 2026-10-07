---
title: "Drive the already-matched redirect tests through their Rails controllers"
status: ready
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 610
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`port-redirect-send-file-and-required-params-through-test-case` added
`RedirectController` and the missing tests, and stopped at the LOC ceiling. The
tests that were already matched still run on the old shape. The send_file half
of this work is `drive-send-file-tests-through-send-file-controller`.

`packages/actionpack/src/action-controller/controller/redirect.test.ts`:

- 39 `RedirectTest` / `ModuleRedirectTest` tests (`test_simple_redirect`
  through `test_redirect_back_with_explicit_fallback_kwarg`,
  `test_redirect_to_nil`, `test_redirect_to_params`, `test_unsafe_redirect`,
  `test_unsafe_redirect_back`, `test_only_path_redirect`,
  `test_redirect_to_external_with_rescue`, and the four in `ModuleTest`,
  `vendor/rails/v8.0.2/actionpack/test/controller/redirect_test.rb:225-413,470-484,517-537,582-588,626-630,641-675`)
  call the free `redirectTo` / `redirectBack` of `action-dispatch/redirect.js`
  instead of `get :action` through `ActionController::TestCase`.
- `RedirectController` holds only the actions the newly ported tests reach. The
  rest of `redirect_test.rb:29-221` is unported, including the raising
  `status` / `location` readers (`:32-33`), `rescue_errors` and the private
  `dashboard_url` (`:214-220`), and `ModuleTest::ModuleRedirectController`
  (`:642-647`).
- `test_redirect_to_url_with_stringlike` sits out of Rails order.

## Acceptance criteria

- Every test in `redirect.test.ts` runs through its Rails controller and
  `ActionController::TestCase`, in Rails order, with Rails' assertions.
- `RedirectController` and `ModuleRedirectController` carry every Rails action.
- `pnpm parity:test:assertions` shows no mismatch for
  `controller/redirect_test.rb`.
