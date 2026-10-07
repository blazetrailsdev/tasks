---
title: "Drive the already-matched redirect and send_file tests through their Rails controllers"
status: ready
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 650
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`port-redirect-send-file-and-required-params-through-test-case` added
`RedirectController`, `SendFileController` and the missing tests, and stopped at
the LOC ceiling. The tests that were already matched still run on the old shape.

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

`controller/send-file.test.ts`:

- The 18 pre-existing `SendFileTest` tests define an ad-hoc `class C extends
Base` per test and call `c.dispatch`, and the file still imports `fs`, `path`
  and `os` to write a temp file. Rails drives `SendFileController` through
  `process` and reads the test file itself (`send_file_test.rb:5-9,80-208,261-289`).
- `SendFileController` lacks `layout "layouts/standard"`,
  `include ActionController::Testing`, the six `test_send_file_headers_*`
  actions (`:13,14,31-67`) and `SendFileWithActionControllerLive` (`:74-76`).

## Acceptance criteria

- Every test in both files runs through its Rails controller and
  `ActionController::TestCase`, in Rails order, with Rails' assertions.
- `RedirectController`, `ModuleRedirectController`, `SendFileController` and
  `SendFileWithActionControllerLive` carry every Rails action.
- `send-file.test.ts` has no `fs` / `path` / `os` import and no temp file.
- `pnpm parity:test:assertions` shows no mismatch for either file.
