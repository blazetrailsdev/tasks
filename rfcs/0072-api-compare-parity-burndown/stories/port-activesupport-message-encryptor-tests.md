---
title: "port-activesupport-message-encryptor-tests"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6140
claim: "2026-08-05T20:13:09Z"
assignee: "check-current-protected-environment-pool-migration-context-blocked-on-adapter-proxy"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/message-encryptor.test.ts` covers none of
`message_encryptor_test.rb`: `parity:test` reports 0/15 — 2 bodyless
`it.skip` placeholders and 13 cases with no placeholder at all.

Rails source: `vendor/rails/activesupport/test/message_encryptor_test.rb`.
The file's `setup` builds encryptors over `SecureRandom.random_bytes(32)` and
several cases toggle
`ActiveSupport::MessageEncryptor.use_authenticated_message_encryption`, so the
AEAD-gated subset cannot land until
`port-activesupport-message-encryptor-authenticated-encryption` (PR #5963)
ships `default_cipher` / `aead_mode?` / auth-tag handling.

Split the work accordingly: port the cases that need only the existing
non-authenticated path first, and take the AEAD-gated ones after #5963 merges.
The shared `MessageCodecTests` / `MessageMetadataTests` modules are already
ported (`messages/message-metadata-tests.ts`), as is
`MessageRotatorTests` (`messages/message-rotator-tests.ts`, PR #5961) — reuse
them rather than writing local helpers.

Note `inspect does not show secrets` has no direct JS analogue (no Ruby
`inspect`); decide between a `SKIP_GROUPS` entry with a reason and a JS-side
equivalent before inventing one — the same question is open in
`port-activesupport-message-verifier-tests`.

## Acceptance criteria

- The 2 placeholders replaced with real tests and the 13 unported cases added,
  names matching Rails verbatim, minus any AEAD-gated subset explicitly
  deferred to #5963 in the PR body.
- `parity:test` for `message_encryptor_test.rb` improves from 0/15.
- `pnpm typecheck` and `pnpm lint` pass.
