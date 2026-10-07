---
title: "CSRF token compares call fixed_length_secure_compare; encode_csrf_token calls Base64.urlsafe_encode64"
status: done
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8642
claim: "2026-10-07T16:26:20Z"
assignee: "data-source-sql-kwargs-only-first-position-arm"
blocked-by: null
closed-reason: null
---

## Context

Left by trails PR 8576, which routed every private instance method of
`ActionController::RequestForgeryProtection` through `this` and converged
`decode_csrf_token`, `xor_byte_strings`, `generate_csrf_token` and
`csrf_token_hmac`. Three bodies in
`packages/actionpack/src/action-controller/metal/request-forgery-protection.ts`
still deviate:

- `compareWithRealToken`, `compareWithGlobalToken` and `isValidPerFormCsrfToken`
  call a file-local `compareBuffers` helper (length check plus
  `getCrypto().timingSafeEqual`). Rails calls
  `ActiveSupport::SecurityUtils.fixed_length_secure_compare`
  (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/request_forgery_protection.rb:547,551,562`).
  The port exists at `packages/activesupport/src/security-utils.ts`. Rails'
  version raises `ArgumentError` on a length mismatch, where the helper answers
  false.
- `isValidPerFormCsrfToken` returns early on `!this.perFormCsrfTokens`, where
  Rails has `if per_form_csrf_tokens ... else false end` (`:554-566`), and reads
  `this.request.requestMethod ?? this.request.method` where Rails reads
  `request.request_method`.
- `encodeCsrfToken` is `toString("base64")` plus three `replace` calls. Rails is
  `Base64.urlsafe_encode64(csrf_token, padding: false)` (`:661-663`). ruby-compat's
  `Base64` (`packages/ruby-compat/src/base64.ts`) has `strictEncode64`,
  `strictDecode64` and `urlsafeDecode64` but no `urlsafeEncode64`
  (`vendor/ruby/v3.3.11/lib/base64.rb`, `urlsafe_encode64`).

## Acceptance criteria

- The three compare methods call `SecurityUtils.fixedLengthSecureCompare` and
  `compareBuffers` is deleted.
- `isValidPerFormCsrfToken` has Rails' `if` / `else` shape and reads
  `request.requestMethod`.
- ruby-compat gains `Base64.urlsafeEncode64` ported from MRI with its receipt, and
  `encodeCsrfToken` calls it with `padding: false`.
- `pnpm parity:api:calls` and `parity:api:calls:args` stay green; both
  `request-forgery-protection.test.ts` files stay green.
