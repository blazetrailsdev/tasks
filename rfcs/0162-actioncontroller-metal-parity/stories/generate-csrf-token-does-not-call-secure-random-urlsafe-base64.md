---
title: "generate_csrf_token calls SecureRandom.urlsafe_base64; port FreeCookieControllerTest's stub"
status: in-progress
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8576
claim: "2026-10-06T14:01:14Z"
assignee: "callback-object-filter-type-and-csrf-private-dispatch"
blocked-by: null
closed-reason: null
---

## Context

`ActionController::RequestForgeryProtection#generate_csrf_token`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/request_forgery_protection.rb:657-659`)
is `SecureRandom.urlsafe_base64(AUTHENTICITY_TOKEN_LENGTH)`. trails'
`generateCsrfToken`
(`packages/actionpack/src/action-controller/metal/request-forgery-protection.ts:442-446`)
calls `encodeCsrfToken(SecureRandom.randomBytes(AUTHENTICITY_TOKEN_LENGTH))`
instead, because `packages/ruby-compat/src/secure-random.ts` has no
`urlsafeBase64`.

`FreeCookieControllerTest`
(`vendor/rails/v8.0.2/actionpack/test/controller/request_forgery_protection_test.rb:834-869`)
wraps every test in `SecureRandom.stub :urlsafe_base64, @token`, with
`@token = "cf50faa3fe97702ca1ae"` from its `setup`. The port in
`packages/actionpack/src/action-controller/controller/request-forgery-protection.test.ts`
omits the stub and the literal: there is no `urlsafeBase64` to stub, and stubbing
`randomBytes` would pin the deviation.

## Acceptance criteria

- `SecureRandom.urlsafeBase64` exists in ruby-compat, ported from MRI's
  `Random::Formatter#urlsafe_base64`, and `generateCsrfToken` calls it as Rails does.
- `FreeCookieControllerTest` sets `@token` in its setup and
  `test_should_allow_all_methods_without_token` runs inside the
  `SecureRandom.urlsafe_base64` stub.
