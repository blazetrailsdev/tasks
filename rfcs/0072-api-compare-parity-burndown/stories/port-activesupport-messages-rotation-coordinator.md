---
title: "port-activesupport-messages-rotation-coordinator"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5974
claim: "2026-08-03T14:20:41Z"
assignee: "port-activesupport-messages-rotation-coordinator"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Messages::RotationCoordinator` is unported. `parity:api`
reports `messages/rotation_coordinator.rb` at 0/11 methods with no
`packages/activesupport/src/messages/rotation-coordinator.ts`.

Rails source: `vendor/rails/activesupport/lib/active_support/messages/rotation_coordinator.rb`
(93 lines). It is the base class behind `ActiveSupport::MessageVerifiers` and
`ActiveSupport::MessageEncryptors`: it holds `transitional`, `on_rotation`,
`rotate`, `rotate_defaults`, `clear_rotations`, `[]`, `[]=`, and the
`build`/`changed?` internals, and swaps the first two rotations when
`transitional` is set.

`Messages::Rotator` and `RotationConfiguration` are already ported
(`messages/rotator.ts`, `messages/rotation-configuration.ts`, PR #5960) — the
coordinator is a separate surface that composes codecs rather than wrapping
one, so it does not reuse them.

Rails has no `rotation_coordinator_test.rb` of its own; the behaviour is
covered through `message_verifiers_test.rb` / `message_encryptors_test.rb`
(`vendor/rails/activesupport/test/rotation_coordinator_tests.rb` is the shared
module those two include). Port that shared module here so both consumer
stories can include it.

## Acceptance criteria

- `packages/activesupport/src/messages/rotation-coordinator.ts` ported, method
  names matching Rails.
- `rotation_coordinator_tests.rb`'s shared cases ported as a shared TS module
  the consumer test files can include, following the
  `messages/message-rotator-tests.ts` precedent.
- `parity:api` for `messages/rotation_coordinator.rb` improves from 0/11.
- `pnpm typecheck` and `pnpm lint` pass.
