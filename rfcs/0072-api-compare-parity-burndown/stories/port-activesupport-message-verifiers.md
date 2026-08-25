---
title: "port-activesupport-message-verifiers"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5972
claim: "2026-08-03T14:06:39Z"
assignee: "port-activesupport-message-verifiers"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::MessageVerifiers` is unported: there is no
`packages/activesupport/src/message-verifiers.ts`, and
`packages/activesupport/src/message-verifiers.test.ts` holds 3 bodyless
`it.skip` placeholders (`parity:test`: `message_verifiers_test.rb` 0/3, 3
skipped):

- `can override secret generator`
- `supports arbitrary secret generator kwargs`
- `supports arbitrary secret generator kwargs when using #rotate block`

Rails source: `vendor/rails/activesupport/lib/active_support/message_verifiers.rb`
(137 lines) — a `Messages::RotationCoordinator` subclass supplying
`build`/`changed?` for `MessageVerifier`, plus `rotate(**options)` and the
`secret_generator` plumbing.

`MessageVerifier` itself is ported and now has rotation support
(`messages/rotator.ts`, PR #5960).

## Acceptance criteria

- `packages/activesupport/src/message-verifiers.ts` ported.
- The 3 placeholders replaced with real tests, names matching Rails verbatim.
- `pnpm typecheck` and `pnpm lint` pass.

Depends on `port-activesupport-messages-rotation-coordinator` — this class is
a `RotationCoordinator` subclass and its tests include the shared
`rotation_coordinator_tests.rb` module.
