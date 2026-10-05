---
title: "Converge HttpAuthentication's Base64, split and credentials-hash bodies"
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
closed-reason: "superseded by http-authentication-base64-bodies-go-through-buffer: the split and credentials-hash items were converged in trails#8523"
---

## Context

`packages/actionpack/src/action-controller/metal/http-authentication.ts` now has
Rails' `HttpAuthentication::Basic` / `Digest` / `Token` layout, but four bodies
still differ from
`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/http_authentication.rb`.
They were left as they were by the restructure and are invisible to the call
gate, which extracts no call set for a namespace member.

- `Basic.decodeCredentials` (`:128`), `Basic.encodeCredentials` (`:140`),
  `Digest.nonce` (`:324`) and `Digest.validateNonce` (`:331`) go through
  `Buffer` with a UTF-8 round trip. Rails calls `::Base64.decode64` and
  `::Base64.strict_encode64`. ruby-compat's `Base64`
  (`packages/ruby-compat/src/base64.ts`) has `strictEncode64` only, over a
  binary String, so `decode64` (`vendor/ruby/v3.3.11/lib/base64.rb`) has to be
  added there first.
- `Basic.userNameAndPassword` returns `[decoded, ""]` for a credential with no
  colon. Rails' `decode_credentials(request).split(":", 2)` (`:112`) answers a
  one-element array, and an empty array for an empty credential, so
  `login_procedure` sees `nil`.
- `Digest.decodeCredentials` returns a plain `Record`. Rails builds an
  `ActiveSupport::HashWithIndifferentAccess` (`:308`). `Token.tokenAndOptions`
  already returns one.
- `Digest.secretToken` converts a `Buffer` key to a binary string. Rails returns
  `key_generator.generate_key(http_auth_salt)` as is (`:331`).
- The two file-local helpers `splitOnFirstWhitespace` and `reqAuth` stand in for
  `request.authorization.to_s.split(" ", 2)` (`:120,124`).

## Acceptance criteria

- ruby-compat `Base64.decode64` exists with its MRI citation and receipt, and
  the four bodies above call `Base64.decode64` / `Base64.strictEncode64`.
- `Basic.userNameAndPassword` answers what `String#split(":", 2)` answers, with
  a test for the no-colon and empty credentials.
- `Digest.decodeCredentials` returns a `HashWithIndifferentAccess`, and every
  `credentials[:key]` read in `Digest` goes through it.
- `Digest.secretToken` returns the key generator's value unconverted, or the
  conversion is moved to where the bytes are consumed.
- No file-local helper remains in the file that Rails does not have.
