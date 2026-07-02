---
title: "encrypt-route-primary-attribute-through-encrypt-attribute"
status: ready
updated: 2026-07-02
rfc: "0047-widen-call-set-parity-all-ported"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up to encrypt-unify-declaration-paths-onto-scheme (PR that retired the
duplicate `_preserveOriginalEncrypted`). That PR unified the ignore_case
preserve-original wiring onto the shared scheme-based
`EncryptableRecord.preserveOriginalEncrypted`, but the **primary attribute**
declared via `Base.encrypts` still flows through `encryption.ts#encrypts`, not
`EncryptableRecord.encryptAttribute`.

Two concrete blockers keep the primary path on `encryption.ts`:

1. **Scheme construction differs.** `encryption.ts#buildScheme`
   (packages/activerecord/src/encryption.ts) adapts the legacy simple
   `{ encrypt, decrypt }` option into a `LegacyEncryptorShim` and supplies a
   `defaultEncryptor` fallback when no key material is configured.
   `EncryptableRecord`'s `schemeFor` (encryptable-record.ts) does neither — it
   expects a ready `EncryptorLike`. Routing the primary attribute through
   `encryptAttribute` needs `buildScheme` (or an equivalent) reachable from the
   scheme path.

2. **Decoration machinery differs.** `encryption.ts#encrypts` uses
   `_pendingEncryptions` + `applyPendingEncryptions` (mirrors Rails
   `decorate_attributes`/`PendingDecorator`) so the encrypted type survives
   `_defaultAttributes` rebuilds and schema reflection — required because
   `Base.encrypts` declares at static-init before schema is loaded.
   `encryptAttribute` sets `_attributeDefinitions` **directly** and immediately;
   direct callers in `configurable.test.ts` / `encryption-schemes.test.ts`
   assert `_attributeDefinitions.get(name).type` right after the call, so
   `encryptAttribute` cannot simply become lazy without breaking them.

Empirically verified during the parent PR: naively routing `original_<name>`
through the direct-set `encryptAttribute` on the Base path caused the encrypted
type to be lost on `_defaultAttributes` replay (ciphertext leaked to reads).

## Acceptance criteria

- [ ] `Base.encrypts` declares the primary attribute through
      `EncryptableRecord.encryptAttribute` (single declaration path, mirroring
      Rails' single `encrypts`).
- [ ] `buildScheme` legacy-encryptor + defaultEncryptor handling is preserved
      (shared, not duplicated).
- [ ] Pending-decoration / schema-reflection replay still works for
      static-init `Base.encrypts` models AND direct `encryptAttribute` callers
      still get immediate registration.
- [ ] All encryption tests green; no api:compare / call-mismatch regressions.
