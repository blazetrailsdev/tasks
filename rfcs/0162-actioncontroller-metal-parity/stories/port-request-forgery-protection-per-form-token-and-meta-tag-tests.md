---
title: "port-request-forgery-protection-per-form-token-and-meta-tag-tests"
status: draft
updated: 2026-09-29
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`delete-invented-action-dispatch-respond-to-and-csrf-modules` deleted the
invented `action-dispatch/request-forgery-protection.ts` class and wired
`ActionController::Base` onto the metal concern
(`packages/actionpack/src/action-controller/metal/request-forgery-protection.ts`,
`RequestForgeryProtection[included]` + `protectFromForgery`). 20 Rails-named tests in
`packages/actionpack/src/action-controller/controller/request-forgery-protection.test.ts`
had bodies that drove the deleted class (`csrf.generatePerFormToken`,
`csrf.csrfMetaTag`, `csrf.verifyToken`). They are now `it.skip` stubs, because
their Rails bodies read the token out of rendered HTML, which trails cannot render yet:

- `PerFormTokensControllerTest`
  (`vendor/rails/v8.0.2/actionpack/test/controller/request_forgery_protection_test.rb:910-1232`):
  18 tests. Each `get :index` renders
  `form_tag (params[:form_path] || '/per_form_tokens/post_one'), method: params[:form_method]`
  (`:169-171`), then `assert_presence_and_fetch_form_csrf_token` scrapes the
  `authenticity_token` hidden field. trails' `formTag` emits no token tag.
- `RequestForgeryProtectionControllerUsingResetSessionTest#should emit a csrf-param meta tag and a csrf-token meta tag`
  (`:728-737`): it needs `csrf_meta_tags` (story `port-action-view-csrf-helper-and-generated-layout-meta-tags`).
- `CustomAuthenticityParamControllerTest#test_should_not_warn_if_form_authenticity_param_matches_form_authenticity_token`
  (`:886-896`): it stubs the private `valid_authenticity_token?`, which the metal
  port calls through `isValidAuthenticityToken.call(this, …)`, not through `this`.

Newly skipped:

- `should emit a csrf-param meta tag and a csrf-token meta tag`
- `should not warn if form authenticity param matches form authenticity token`
- `per form token is same size as global token`
- `accepts token for correct path and method`
- `accepts token with path with query params`
- `rejects token for incorrect path`
- `rejects token for incorrect method`
- `accepts global csrf token`
- `returns hmacd token`
- `chomps slashes`
- `ignores trailing slash during generation`
- `handles empty path as request path`
- `handles query string`
- `handles fragment`
- `ignores trailing slash during validation`
- `method is case insensitive`
- `does not return old csrf token`
- `accepts old csrf token`
- `ignores origin during generation`
- `ignores origin during generation with protocol-relative url`

## Acceptance criteria

- `form_tag` / `button_to` emit the `authenticity_token` hidden field through the
  controller's `form_authenticity_token(form_options:)` (per `form_tag_helper.rb`'s `token_tag`).
- The 18 `PerFormTokensControllerTest` bodies are ported from Rails verbatim
  against `PerFormTokensController` (`protect_from_forgery with: :exception`,
  `self.per_form_csrf_tokens = true`).
- The meta-tag test is ported once `csrf_meta_tags` lands.
- `valid_authenticity_token?` is reached through `this`, so the stub in the custom-param test takes effect, and that test is ported.
