---
title: "converge-encrypted-file-cipher-to-aes-128-gcm"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps:
  - port-activesupport-message-encryptor-authenticated-encryption
deps-rfc: []
est-loc: null
priority: null
pr: 5994
claim: "2026-08-03T17:26:42Z"
assignee: "converge-encrypted-file-cipher-to-aes-128-gcm"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/encrypted-file.ts:29` declares
`const CIPHER = "aes-256-cbc"`. Rails'
`vendor/rails/activesupport/lib/active_support/encrypted_file.rb:29` declares
`CIPHER = "aes-128-gcm"` — a different algorithm, a different key size, and
authenticated rather than unauthenticated.

The divergence predates PR #5963 and is not a regression, but that PR made it
newly load-bearing in two ways:

- `EncryptedFile.generateKey()` is now
  `SecureRandom.hex(MessageEncryptor.keyLen(CIPHER))` (matching
  `encrypted_file.rb:31-32`), so `CIPHER` determines the generated key length:
  32 bytes / 64 hex chars today, 16 bytes / 32 hex chars in Rails.
- `MessageEncryptor` gained AEAD (GCM auth tag) support, which was the missing
  prerequisite — an `aes-128-gcm` `EncryptedFile` could not previously have
  round-tripped at all.

`EncryptedFile.expectedKeyLength()` derives from `generateKey().length`, so
flipping `CIPHER` changes the accepted key length and **invalidates every
existing key file**. That migration cost is the reason this is its own story
rather than a drive-by.

Rails also passes `serializer: Marshal` at `encrypted_file.rb:113`; trails
passes `NullSerializer`. Check whether that is a related divergence while here.

## Acceptance criteria

- `packages/activesupport/src/encrypted-file.ts` uses Rails' `aes-128-gcm`,
  or the deviation is justified in a JSDoc at the constant with a concrete
  reason (not "pre-existing").
- `expectedKeyLength()` reports Rails' value (32 hex chars) if the cipher
  flips, and `encrypted-file.test.ts` covers the round trip under the new
  cipher.
- Any key-length migration impact called out in the PR body.
- `pnpm vitest run packages/activesupport/src/encrypted-file.test.ts`,
  `pnpm typecheck`, and `pnpm lint` pass.
