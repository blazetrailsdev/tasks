---
title: "port-activesupport-messages-rotator-surface"
status: claimed
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-03T11:55:46Z"
assignee: "port-activesupport-messages-rotator-surface"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Messages::Rotator` and
`ActiveSupport::Messages::RotationConfiguration` are not ported to trails.
`packages/activesupport/src/message-verifier.ts` and `message-encryptor.ts`
have no `rotate` method, and there is no `packages/activesupport/src/messages/rotator.ts`
or `rotation-configuration.ts`.

The six bodyless `it.skip` placeholders that stood in for the tests were
deleted (story `port-activesupport-messages-rotation-tests`) because there was
nothing to test. This story ports the surface itself, plus its tests.

Rails sources:

- `vendor/rails/activesupport/lib/active_support/messages/rotator.rb`
- `vendor/rails/activesupport/lib/active_support/messages/rotation_configuration.rb`

Rails tests:

- `vendor/rails/activesupport/test/message_encryptor_test.rb` — `rotate cipher`,
  `rotate verifier secret when using non-authenticated encryption`,
  `rotate verifier digest when using non-authenticated encryption`
- `vendor/rails/activesupport/test/message_verifier_test.rb` — `rotate digest`
- `vendor/rails/activesupport/test/messages/rotation_configuration_test.rb` —
  `signed configurations`, `encrypted configurations`

Note `packages/activesupport/src/secure-compare-rotator.test.ts` also holds five
bodyless `it.skip` placeholders for `ActiveSupport::SecureCompareRotator`, which
is likewise unported — out of scope here unless it falls out naturally.

## Acceptance criteria

- `Messages::Rotator` and `Messages::RotationConfiguration` ported, with
  `rotate` wired into `MessageVerifier` and `MessageEncryptor`.
- The six Rails tests above ported with names matching Rails verbatim.
- `pnpm vitest run packages/activesupport/src/messages/`, `pnpm typecheck`, and
  `pnpm lint` pass.
