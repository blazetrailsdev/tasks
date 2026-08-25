---
title: "converge-encryption-simple-encryptor-onto-encryptor-like"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done: the narrow local Encryptor interface is gone — encryption.ts:43 is now a type alias to EncryptorOptionLike, i.e. the real Encryption::Encryptor contract, not a second surface."
---

## Context

`packages/activerecord/src/encryption.ts:42` declares a local
`interface Encryptor { encrypt, decrypt, isEncrypted?, isBinary? }` — a
trails-only "simple encryptor" surface that `Base.encrypts({ encryptor })`
accepts and that `LegacyEncryptorShim` (same file, line 97) widens to the real
`EncryptorLike` (`encryption/encryptor.ts:36`). Rails has exactly one encryptor
contract: `ActiveRecord::Encryption::Encryptor`
(`vendor/rails/activerecord/lib/active_record/encryption/encryptor.rb:13`),
which trails ports as a class at `encryption/encryptor.ts:50`. The narrow
interface and its shim exist only to keep older call sites working.

Found by the RFC 0080 audit of `moved` interface declaration names
(`audit-moved-interface-declaration-names`), which tagged it
`@noRailsEquivalent CONVERGEABLE (story: <this story>)`.

## Acceptance criteria

- `Base.encrypts({ encryptor })` accepts `EncryptorLike` directly; call sites
  and tests passing the narrow shape are updated.
- The local `Encryptor` interface, `defaultEncryptor` and `LegacyEncryptorShim`
  are deleted along with the `@noRailsEquivalent` tag.
- `pnpm parity:api:extra` exits 0 (no stale tag).
