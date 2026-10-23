---
title: "Port the fourteen request_forgery_protection form/token-tag tests now that TestCase answers assert_select"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Fourteen tests in
`packages/actionpack/src/action-controller/controller/request-forgery-protection.test.ts`
are empty `it.skip` stubs, each under `// BLOCKED: port-request-forgery-form-token-tag-tests`
(`:364-427`, `:815-816`, `:928-931`). Both things they waited on are done:
`ActionController::TestCase` answers `assertSelect`
(`action-controller-test-case-has-no-assert-select`) and `csrf_meta_tags` is ported
(`port-action-view-csrf-helper-and-generated-layout-meta-tags`).

The stubs mirror `vendor/rails/v8.0.2/actionpack/test/controller/request_forgery_protection_test.rb`:

- 11 in the shared `RequestForgeryProtectionTests` module: `test_should_render_form_with_token_tag`
  (`:254`), `test_should_render_button_to_with_token_tag` (`:263`), the
  `..._external_authenticity_token_requested...` pairs (`:292`, `:305`, `:350`, `:363`), the
  `..._authenticity_token_requested` tests (`:312`, `:321`, `:370`, `:379`) and
  `test_should_render_form_with_with_token_tag_if_remote_and_embedding_token_is_on` (`:388`).
  Most wrap the request in `@controller.stub :form_authenticity_token, @token`.
- 2 in `FreeCookieControllerTest` (`:841`, `:848`), which also stub `SecureRandom.urlsafe_base64`.
- 1, "should emit a csrf-param meta tag and a csrf-token meta tag", renders `csrf_meta_tags`.

The controller actions they drive (`showButton`, `formForRemoteWithToken`, `formForWithToken`,
`formForRemoteWithExternalToken`, `formWithRemoteWithToken`, `formWithLocalWithToken`,
`formWithRemoteWithExternalToken`, `meta`) are already ported in the test file.

(Merged from the duplicate `port-request-forgery-protection-assert-select-and-meta-tag-skips`.)

## Acceptance criteria

- Each of the fourteen stubs is ported with the Rails body (including the
  `form_authenticity_token` / `SecureRandom.urlsafe_base64` stubs) and passes, using
  `assert_select` rather than a regex over `response.body`, with test names unchanged.
- A test that needs an unported view helper keeps its skip under a `BLOCKED:` line naming an
  open story, not this one.
- `pnpm parity:test --package actioncontroller` skip count drops accordingly.
