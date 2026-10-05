---
title: "HttpAuthentication's Base64 bodies go through Buffer, not ruby-compat Base64"
status: closed
updated: 2026-10-05
rfc: "0162-actioncontroller-metal-parity"
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
closed-reason: "done in trails#8523: Base64.decode64 added to ruby-compat and the four Base64 bodies call it; the key-bytes form is recorded in the PR body"
---

## Context

`packages/actionpack/src/action-controller/metal/http-authentication.ts` has
Rails' `HttpAuthentication::Basic` / `Digest` / `Token` layout (trails PR 8523).
Five bodies still reach Base64 or the key bytes through `Buffer` where
`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/http_authentication.rb`
calls Ruby's `Base64`. The call gate does not see them, because it extracts no
call set for a namespace member.

- `Basic.decodeCredentials` is `::Base64.decode64(auth_param(request) || "")`
  (`http_authentication.rb:123`) and `Digest.validateNonce` is
  `::Base64.decode64(value).split(":").first.to_i` (`:343`). ruby-compat's
  `Base64` (`packages/ruby-compat/src/base64.ts`) has no `decode64`, and
  `unpack1` (`packages/ruby-compat/src/array.ts`) has no `m` directive
  (`vendor/ruby/v3.3.11/lib/base64.rb`, `pack.c`).
- `Basic.encodeCredentials` (`:135`) and `Digest.nonce` (`:334`) are
  `::Base64.strict_encode64`. ruby-compat's `Base64.strictEncode64` exists, over
  a binary String, so the UTF-8 credential has to be handed to it as bytes.
- `Digest.secretToken` converts a `Buffer` key to a binary string. Rails returns
  `key_generator.generate_key(http_auth_salt)` as it is (`:291`).

A decoded credential is text: Rails compares it bytewise against a UTF-8 `name`
(`:90-91`), so the decoded bytes have to read as the JS string they spell.

## Acceptance criteria

- ruby-compat `Base64.decode64` exists with its MRI citation and receipt.
- The four Base64 bodies call `Base64.decode64` / `Base64.strictEncode64`, with
  a test for a non-ASCII user name and password round trip.
- `Digest.secretToken` returns the key generator's value unconverted, or the
  conversion moves to where the bytes are consumed.
- No `Buffer` reference remains in the file.
