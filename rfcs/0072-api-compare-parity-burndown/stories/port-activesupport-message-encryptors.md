---
title: "port-activesupport-message-encryptors"
status: done
updated: 2026-08-04
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps:
  - port-activesupport-messages-rotation-coordinator
deps-rfc: []
est-loc: null
priority: null
pr: 6067
claim: "2026-08-04T15:34:07Z"
assignee: "port-activesupport-message-encryptors"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::MessageEncryptors` is unported: there is no
`packages/activesupport/src/message-encryptors.ts`, and
`packages/activesupport/src/message-encryptors.test.ts` holds 4 bodyless
`it.skip` placeholders (`parity:test`: `message_encryptors_test.rb` 0/4, 4
skipped):

- `can override secret generator`
- `supports arbitrary secret generator kwargs`
- `supports arbitrary secret generator kwargs when using #rotate block`
- `supports separate secrets for encryption and signing`

Rails source: `vendor/rails/activesupport/lib/active_support/message_encryptors.rb`
(141 lines) — a `Messages::RotationCoordinator` subclass supplying
`build`/`changed?` for `MessageEncryptor`, plus `rotate(**options)` and the
`secret_generator` plumbing.

Note `supports separate secrets for encryption and signing` exercises
`MessageEncryptor.new(secret, sign_secret, **options)`; that constructor shape
was fixed in PR #5961 (options were dropped when the sign secret was passed
explicitly as `undefined`).

## Acceptance criteria

- `packages/activesupport/src/message-encryptors.ts` ported.
- The 4 placeholders replaced with real tests, names matching Rails verbatim.
- `pnpm typecheck` and `pnpm lint` pass.

Depends on `port-activesupport-messages-rotation-coordinator` — this class is
a `RotationCoordinator` subclass and its tests include the shared
`rotation_coordinator_tests.rb` module.
