---
title: "port-activesupport-secure-compare-rotator"
status: done
updated: 2026-08-06
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6145
claim: "2026-08-05T23:40:20Z"
assignee: "mysql-full-version-belongs-on-mysql2-adapter"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/secure-compare-rotator.test.ts` holds five bodyless
`it.skip` placeholders and no implementation file exists —
`parity:api` reports `secure_compare_rotator.rb -> secure-compare-rotator.ts`
at 0/3 methods (`initialize`, `rotate`, `secure_compare!`).

CLAUDE.md forbids empty stubs. The equivalent placeholders in
`packages/activesupport/src/messages/` were resolved by
`port-activesupport-messages-rotation-tests` (PR #5960), which ported
`Messages::Rotator` and `RotationConfiguration`; `SecureCompareRotator` was
explicitly left out of that PR's scope.

`SecureCompareRotator` includes `Messages::Rotator`, which is now ported at
`packages/activesupport/src/messages/rotator.ts` — its `initialize` / `rotate` /
`fallBackTo` / `readMessage` are installed onto a class with `Object.assign` +
`prepend()` (see `message-verifier.ts` for the pattern).

Rails source:
`vendor/rails/activesupport/lib/active_support/secure_compare_rotator.rb`
Rails test:
`vendor/rails/activesupport/test/secure_compare_rotator_test.rb`

Test names to keep verbatim:

- `#secure_compare! works correctly after rotation`
- `#secure_compare! works correctly after multiple rotation`
- `#secure_compare! fails correctly when credential is not part of the rotation`
- `#secure_compare! calls the on_rotation proc`
- `#secure_compare! calls the on_rotation proc that given in constructor`

## Acceptance criteria

- `packages/activesupport/src/secure-compare-rotator.ts` ported, reusing
  `messages/rotator.ts` the way `MessageVerifier` does.
- The five tests above ported with names matching Rails verbatim; no bodyless
  `it.skip` remains in the file.
- `pnpm vitest run packages/activesupport/src/secure-compare-rotator.test.ts`,
  `pnpm typecheck`, and `pnpm lint` pass.
