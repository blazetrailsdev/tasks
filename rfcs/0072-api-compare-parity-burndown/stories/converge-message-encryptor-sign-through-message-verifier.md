---
title: "converge-message-encryptor-sign-through-message-verifier"
status: ready
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
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
The case is `it.skip`ped in
`packages/activesupport/src/message-encryptor.test.ts` with a pointer here.

## Acceptance criteria

- [ ] `MessageEncryptor` signs through a `MessageVerifier` built with
      `NullSerializer`, as Rails does, so the message is
      `Base64(payload)--digest`.
- [ ] `messing with either encrypted values causes failure` is un-skipped and
      passes.
- [ ] The `aead` (unsigned) path is unaffected — Rails only signs in
      non-AEAD mode.
