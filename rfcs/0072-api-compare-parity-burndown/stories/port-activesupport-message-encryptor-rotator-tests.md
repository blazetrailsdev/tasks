---
title: "port-activesupport-message-encryptor-rotator-tests"
status: closed
updated: 2026-08-03
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
closed-reason: "Superseded by PR #5961 (story port-activesupport-messages-rotator-surface), which was rescoped after #5960 merged and now ports all three MessageEncryptorRotatorTest cases plus the shared MessageRotatorTests module."
---

## Context

`port-activesupport-message-encryptor-authenticated-encryption` (PR #5963)
ported `MessageEncryptor.useAuthenticatedMessageEncryption`,
`MessageEncryptor.defaultCipher()`, and AEAD (GCM auth tag) handling in
`packages/activesupport/src/message-encryptor.ts`. It could **not** port the
three `MessageEncryptorRotatorTest` cases, because `Messages::Rotator` was not
on `main` at the time and stacking PRs is not allowed.

**Both blockers are now gone.** PR #5960 landed `Messages::Rotator` /
`RotationConfiguration` and wired `rotate` into `MessageEncryptor`, and #5963
landed the authenticated-encryption support the last two tests need.

Note #5960 **deleted**
`packages/activesupport/src/messages/message-encryptor-rotator.test.ts`
outright (it held only bodyless `it.skip` stubs) rather than porting it, so
this story recreates the file from scratch. Port these three, names verbatim:

- `rotate cipher`
- `rotate verifier secret when using non-authenticated encryption`
- `rotate verifier digest when using non-authenticated encryption`

`packages/activesupport/src/messages/message-verifier-rotator.test.ts` (also
from #5960) is the model to follow for the `assertRotate` / `makeCodec` shape.

Rails source:
`vendor/rails/activesupport/test/messages/message_encryptor_rotator_test.rb`
(and the shared `assert_rotate` helper in
`vendor/rails/activesupport/test/messages/message_rotator_tests.rb`).

The latter two need the test-local `with_authenticated_encryption` helper, which
toggles `MessageEncryptor.useAuthenticatedMessageEncryption` and restores it
afterwards.

## Acceptance criteria

- `packages/activesupport/src/messages/message-encryptor-rotator.test.ts` holds
  the three Rails tests above with real bodies, names matching Rails verbatim,
  and no remaining `it.skip` placeholders in that file.
- `assert_rotate` / `make_codec` / `encode` / `decode` /
  `with_authenticated_encryption` helpers ported faithfully.
- `pnpm vitest run packages/activesupport/src/messages/`, `pnpm typecheck`, and
  `pnpm lint` pass.

Blocked until PR #5961 (Messages::Rotator) merges.
