---
title: "Route Base.encrypts through scheme-based encryptAttribute and retire duplicate _preserveOriginalEncrypted"
status: in-progress
updated: 2026-07-02
rfc: "0047-widen-call-set-parity-all-ported"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 4418
claim: "2026-07-02T16:21:50Z"
assignee: "encrypt-unify-declaration-paths-onto-scheme"
blocked-by: null
closed-reason: null
---

## Context

Surfaced during PR #4412 (encrypt-attribute-wire-preserve-original-on-ignore-case).
trails maintains two parallel encryption-declaration paths where Rails has one:

- encryptor-based `encryption.ts#encrypts` (with its own `_preserveOriginalEncrypted`,
  encryption.ts:236) — the path actually wired into `Base.encrypts` via
  `registerEncryptionHooks` (encryption.ts:514).
- scheme-based `EncryptableRecord.encrypts` → `encryptAttribute`
  (packages/activerecord/src/encryption/encryptable-record.ts:188) with the shared
  `preserveOriginalEncrypted` (encryptable-record.ts:242) — currently only exercised
  by tests (configurable.test.ts, encryption-schemes.test.ts), not reachable from
  `Base.encrypts`.

Rails `ActiveRecord::Encryption.encrypts` is a single method
(encryptable_record.rb) that both declares the scheme-based type AND wires
`preserve_original_encrypted`. PR #4412 converged the ignoreCase gap on the
scheme path, but the two paths still coexist and `encryption.ts`'s
`_preserveOriginalEncrypted` now duplicates `EncryptableRecord.preserveOriginalEncrypted`.

## Acceptance criteria

- [ ] `Base.encrypts` routes through the scheme-based
      `EncryptableRecord.encrypts`/`encryptAttribute` path (single declaration path,
      mirroring Rails).
- [ ] Retire the duplicate `_preserveOriginalEncrypted` in encryption.ts once the
      scheme path is the sole path (its ignoreCase wiring is already covered by
      `EncryptableRecord.preserveOriginalEncrypted`).
- [ ] Existing Rails-named encryption tests (encryptable-record.test.ts,
      encryptable-record-api.test.ts, encrypted-fixtures.test.ts) stay green.
- [ ] No api:compare / call-mismatch regressions.
