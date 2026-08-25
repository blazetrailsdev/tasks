---
title: "converge-message-encryptor-sign-through-message-verifier"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages:
  - activesupport
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6219
claim: "2026-08-08T02:39:55Z"
assignee: "converge-message-encryptor-sign-through-message-verifier"
blocked-by: null
closed-reason: null
---

## Context

`MessageEncryptor#create_message` in Rails signs the **encoded** ciphertext:
`sign(encrypt(...))` routes through the internal `MessageVerifier` (built with
`NullSerializer`), whose `create_message` does
`sign_encoded(encode(...))` — so the wire format is
`Base64(<b64text>--<b64iv>)--<digest>`
(`vendor/rails/activesupport/lib/active_support/message_encryptor.rb`,
`message_verifier.rb:200-215`).

trails' `MessageEncryptor#createMessage`
(`packages/activesupport/src/message-encryptor.ts:118-121`) instead emits
`<b64text>--<b64iv>--<digest>` — the payload is never base64-encoded a second
time, and the signature is produced by a private `sign()` rather than by a
`MessageVerifier`. The two schemes round-trip within trails, but they are not
the Rails wire format.

Surfaced by `port-activesupport-message-encryptor-tests`: Rails'
`test_messing_with_either_encrypted_values_causes_failure` does
`@verifier.verify(@encryptor.encrypt_and_sign(@data)).split("--")` to recover
`text` and `iv`. Against trails that raises `InvalidSignature: invalid base64`,
because `extractEncoded` hands `<b64text>--<b64iv>` to a strict base64 decode.
Two cases are `it.skip`ped in
`packages/activesupport/src/message-encryptor.test.ts` with a pointer here:

- `messing with either encrypted values causes failure`, as above.
- `backwards compat for 64 bytes key` (`message_encryptor_test.rb:56-64`), whose
  fixture message _is_ a Rails-format `Base64(payload)--digest`. trails'
  `readMessage` splits the raw string expecting `<b64text>--<b64iv>--<digest>`,
  finds one part after stripping the digest, and raises `missing separator`.
  Its payload is also Marshal-serialized, so it needs
  `message-encryptor-marshal-payload-backwards-compatibility` as well.

## Acceptance criteria

- [ ] `MessageEncryptor` signs through a `MessageVerifier` built with
      `NullSerializer`, as Rails does, so the message is
      `Base64(payload)--digest`.
- [ ] `messing with either encrypted values causes failure` is un-skipped and
      passes.
- [ ] `backwards compat for 64 bytes key` gets past `missing separator` (it
      still needs the Marshal reader to fully pass).
- [ ] The `aead` (unsigned) path is unaffected — Rails only signs in
      non-AEAD mode.
