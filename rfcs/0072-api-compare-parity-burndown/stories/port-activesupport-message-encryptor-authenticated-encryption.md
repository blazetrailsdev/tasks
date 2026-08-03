---
title: "port-activesupport-message-encryptor-authenticated-encryption"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5963
claim: "2026-08-03T12:15:47Z"
assignee: "port-activesupport-message-encryptor-authenticated-encryption"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Messages::Rotator` and `RotationConfiguration` were ported in
`packages/activesupport/src/messages/rotator.ts` and `rotation-configuration.ts`
(story `port-activesupport-messages-rotation-tests`), and `rotate` is wired into
both `MessageVerifier` and `MessageEncryptor`. The three
`MessageEncryptorRotatorTest` cases could not be ported with it because
`MessageEncryptor` has no authenticated-encryption support:

- `packages/activesupport/src/message-encryptor.ts` hardcodes
  `cipher = opts.cipher ?? "aes-256-cbc"`. Rails takes it from
  `default_cipher`, which is `"aes-256-gcm"` when
  `use_authenticated_message_encryption` is set and `"aes-256-cbc"` otherwise.
- There is no `use_authenticated_message_encryption` class attribute.
- `encrypt` / `decrypt` never write or read a GCM auth tag, so an
  `aes-256-gcm` encryptor produces messages it cannot decrypt.

Rails source: `vendor/rails/activesupport/lib/active_support/message_encryptor.rb`
(`default_cipher`, `_encrypt`, `_decrypt`, `aead_mode?`).

Rails tests to port —
`vendor/rails/activesupport/test/messages/message_encryptor_rotator_test.rb`:

- `rotate cipher`
- `rotate verifier secret when using non-authenticated encryption`
- `rotate verifier digest when using non-authenticated encryption`

The latter two need the test-local `with_authenticated_encryption` helper, which
toggles `MessageEncryptor.use_authenticated_message_encryption`.

Note `packages/activesupport/src/secure-compare-rotator.test.ts` still holds five
bodyless `it.skip` placeholders for `ActiveSupport::SecureCompareRotator`, which
is unported — separate work.

## Acceptance criteria

- `MessageEncryptor.useAuthenticatedMessageEncryption` and `defaultCipher`
  ported, with AEAD (GCM auth tag) handling in `encrypt` / `decrypt`.
- `packages/activesupport/src/messages/message-encryptor-rotator.test.ts`
  recreated with the three Rails tests above, names matching verbatim.
- `pnpm vitest run packages/activesupport/src/messages/`, `pnpm typecheck`, and
  `pnpm lint` pass.
