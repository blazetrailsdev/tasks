---
title: "Retire the injected EncryptionHooks interface and route model/record calls through EncryptableRecord"
status: in-progress
updated: 2026-09-22
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: 4
pr: trails#7977
claim: "2026-09-22T18:13:16Z"
assignee: "relocate-encryption-hooks-onto-encryptable-record"
blocked-by: null
closed-reason: null
---

## Context

Found by the PERMANENT-receipt audit.
`packages/activerecord/src/encryption-hooks.ts:3-45` declares an injected
`EncryptionHooks` interface — `encrypts(klass, …)`, `encryptedAttribute(record, name)`,
`ciphertextFor(record, name)`, `encrypt(record)`, `decrypt(record)` — each
member receipted `@noRailsEquivalent PERMANENT`, a no-op default object
`encryptionHooks`, and `registerEncryptionHooks` (also PERMANENT) that the
encryption package calls to swap in the real bodies.

The names match Rails, but the shape does not: Rails has no hook interface.
`encrypts` is a class method on the model and `ciphertext_for` /
`encrypted_attribute?` are record instance methods, mixed in by
`include Encryption::EncryptableRecord`
(`activerecord/lib/active_record/encryption/encryptable_record.rb:49-55,146-163`).
So this is not a file move: the receipts label an invented indirection layer
PERMANENT, and the member names score `moved` only because Rails defines
same-named methods with a different receiver.

## Acceptance criteria

- Callers reach `encrypts` / `ciphertextFor` / `isEncryptedAttribute` /
  `encrypt` / `decrypt` on the model or record through the EncryptableRecord
  mixin (CLAUDE.md § Module mixins), not through a `klass`/`record`-taking hook.
- `EncryptionHooks`, `encryptionHooks` and `registerEncryptionHooks` are deleted;
  if an import cycle genuinely forbids the plain mixin, the replacement is a
  zero-import slot added to CLAUDE.md's list.
- No PERMANENT receipt remains on these names.
