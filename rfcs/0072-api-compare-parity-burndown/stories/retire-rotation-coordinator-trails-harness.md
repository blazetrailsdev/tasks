---
title: "Retire the RotationCoordinator trails-only harness once MessageVerifiers/MessageEncryptors include the shared module"
status: done
updated: 2026-08-04
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6096
claim: "2026-08-04T21:59:03Z"
assignee: "port-compare-with-range"
blocked-by: null
closed-reason: null
---

## Context

PR #5974 ported `ActiveSupport::Messages::RotationCoordinator`
(`vendor/rails/activesupport/lib/active_support/messages/rotation_coordinator.rb`)
and Rails' shared test module
(`vendor/rails/activesupport/test/rotation_coordinator_tests.rb`) as
`packages/activesupport/src/messages/rotation-coordinator-tests.ts`.

Rails has no `rotation_coordinator_test.rb`: the module is only ever included by
`message_verifiers_test.rb` and `message_encryptors_test.rb`. Neither consumer
was ported at the time, so #5974 added a trails-only harness,
`packages/activesupport/src/messages/rotation-coordinator.trails.test.ts`, which
subclasses the coordinator to build `MessageVerifier`s and runs the shared
module against it. Its header comment says so explicitly.

Once `port-activesupport-message-verifiers` and
`port-activesupport-message-encryptors` land and each includes
`rotationCoordinatorTests(...)`, the harness is a duplicate run of the same
cases against a stand-in class that has no Rails counterpart.

## Acceptance criteria

- Both consumer test files include `rotationCoordinatorTests(...)` with their own
  `makeCoordinator` / `roundtrip` hooks.
- `rotation-coordinator.trails.test.ts` is deleted, except for any TS-only case
  with no consumer equivalent — today that is `stringifies a symbol salt before
building` (covers `Symbol#to_s` at rotation_coordinator.rb:82,84) and
  `requires a secret generator` (rotation_coordinator.rb:11); move those to a
  consumer's `.trails.test.ts` rather than dropping them.
- `parity:test` delta is non-negative and `parity:api` stays 11/11 for
  `messages/rotation_coordinator.rb`.
