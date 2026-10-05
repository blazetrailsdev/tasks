---
title: "Port request_forgery_protection_test.rb's assert_select and csrf_meta_tags skips"
status: draft
updated: 2026-10-05
rfc: "0162-actioncontroller-metal-parity"
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

`port-request-forgery-protection-skips-per-form-and-origin` ported the
`RequestForgeryProtectionTests` module of
`vendor/rails/v8.0.2/actionpack/test/controller/request_forgery_protection_test.rb:243-721`
as one `RequestForgeryProtectionTests` function in
`packages/actionpack/src/action-controller/controller/request-forgery-protection.test.ts`,
included into the three classes Rails includes it into. 14 tests stayed
`it.skip` because their Rails bodies need surface trails does not have yet:

- 13 use `assert_select`, which `ActionController::TestCase` lacks
  (`action-controller-test-case-has-no-assert-select`). 11 are in the module:
  `test_should_render_form_with_token_tag` (`:254`),
  `test_should_render_button_to_with_token_tag` (`:263`), the two
  `..._external_authenticity_token_requested...` pairs (`:292`, `:305`, `:350`,
  `:363`), the `..._authenticity_token_requested` tests (`:312`, `:321`, `:370`,
  `:379`) and `test_should_render_form_with_with_token_tag_if_remote_and_embedding_token_is_on`
  (`:388`). 2 are in `FreeCookieControllerTest` (`:841`, `:848`), which also
  stub `SecureRandom.urlsafe_base64`.
- 1, `FreeCookieControllerTest`'s "should not emit a csrf-token meta tag"
  (`:863`), renders `csrf_meta_tags`
  (`port-action-view-csrf-helper-and-generated-layout-meta-tags`).

Each stub carries a `// BLOCKED: <story-id>` line. The controller actions they
drive (`showButton`, `formForRemoteWithToken`, `formForWithToken`,
`formForRemoteWithExternalToken`, `formWithRemoteWithToken`,
`formWithLocalWithToken`, `formWithRemoteWithExternalToken`, `meta`) are already
ported in the test file. Most bodies wrap the request in
`@controller.stub :form_authenticity_token, @token`.

## Acceptance criteria

- The 14 stubs are real tests with the Rails bodies, including the
  `form_authenticity_token` / `SecureRandom.urlsafe_base64` stubs, using
  `assert_select` rather than a regex over `response.body`.
- No `BLOCKED:` line naming either story remains in the file.
