---
title: "Port or remove the six bodyless it.skip rotation tests in messages/"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5960
claim: "2026-08-03T11:45:46Z"
assignee: "port-activesupport-messages-rotation-tests"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/messages/message-encryptor-rotator.test.ts`,
`message-verifier-rotator.test.ts`, and `rotation-configuration.test.ts` contain
only bodyless `it.skip` placeholders — six in total:

- `message-verifier-rotator.test.ts:4` — `rotate digest`
- `message-encryptor-rotator.test.ts:4,6,8` — `rotate cipher`,
  `rotate verifier secret when using non-authenticated encryption`,
  `rotate verifier digest when using non-authenticated encryption`
- `rotation-configuration.test.ts:4,6` — `signed configurations`,
  `encrypted configurations`

They assert nothing, so the rotation surface is untested. CLAUDE.md forbids
empty stubs and placeholder files; these predate that rule and should either be
ported or removed.

Rails counterparts:
`vendor/rails/activesupport/test/message_encryptor_test.rb`,
`vendor/rails/activesupport/test/message_verifier_test.rb`, and
`vendor/rails/activesupport/test/messages/rotation_configuration_test.rb`.

Found while fixing the codec tamper flake (PR #5388), which ran these suites and
saw six skips.

## Acceptance criteria

- Each `it.skip` is either replaced by a real port of the corresponding Rails
  test, or the placeholder is deleted if the underlying rotation surface is not
  yet ported.
- Test names continue to match the Rails test names verbatim.
- No bodyless `it.skip` remains in `packages/activesupport/src/messages/`.
- `pnpm vitest run packages/activesupport/src/messages/`, `pnpm typecheck`,
  and `pnpm lint` pass.
