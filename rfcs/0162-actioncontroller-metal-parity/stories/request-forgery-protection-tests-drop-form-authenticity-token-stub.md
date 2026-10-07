---
title: "RequestForgeryProtectionTests stubs form_authenticity_token where Rails does"
status: done
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8604
claim: "2026-10-06T23:03:13Z"
assignee: "database-config-new-connection-invents-a-still-loading-arm"
blocked-by: null
closed-reason: null
---

## Context

`RequestForgeryProtectionTests`
(`vendor/rails/v8.0.2/actionpack/test/controller/request_forgery_protection_test.rb:440-558`)
wraps the request in `@controller.stub :form_authenticity_token, @token do ... end`
in `test_should_allow_post_with_token` (`:440`), `..._with_strict_encoded_token`
(`:447`), `..._patch_with_token` (`:456`), `..._put_with_token` (`:463`),
`..._delete_with_token` (`:470`), the three origin-check tests (`:501`, `:513`,
`:524`) and `test_should_block_post_with_origin_checking_and_wrong_origin`
(`:537`); `RequestForgeryProtectionControllerUsingExceptionTest#test_raised_exception_message_explains_why_it_occurred`
(`:774`) does the same.

The port in
`packages/actionpack/src/action-controller/controller/request-forgery-protection.test.ts`
(the `RequestForgeryProtectionTests` function, merged in trails#8515) calls the
request with no stub in every one of them. The tests pass either way, since
`index` now renders `form_tag` and the stub only pins the rendered token, but the
bodies are not the Rails bodies.

## Acceptance criteria

- Each test above stubs `formAuthenticityToken` on the controller for the span
  Rails does, with the stub restored when the block's promise settles.
- No new stub helper is invented if activesupport's Minitest `stub` port can be
  used; if none is exported, that gap is filed first.
