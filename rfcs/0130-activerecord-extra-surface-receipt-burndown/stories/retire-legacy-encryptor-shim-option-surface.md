---
title: "encryptor: takes the Encryptor contract only; retire LegacyEncryptorShim"
status: done
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: 2
pr: trails#8052
claim: "2026-09-24T18:29:09Z"
assignee: "adapter-foreign-key-test-loads-fk-test-has-pk-fixture"
blocked-by: null
closed-reason: null
---

## Context

`converge-encryption-simple-encryptor-onto-encryptor-like` (0023) was closed as
"already done". Four receipts still cite it, in the non-canonical
`CONVERGEABLE (story: …)` form:

- `encryption.ts:9`: `type Encryptor = EncryptorOptionLike`
- `encryption/encryptor.ts:24`: `EncryptorOptionLike`
- `encryption/encryptor.ts:36`: `LegacyEncryptorShim`
- `encryption/scheme.ts:32`: `shimUnlessFullEncryptor`

Rails' `encryptor:` option takes exactly one contract,
`ActiveRecord::Encryption::Encryptor` (`encryption/scheme.rb:32-33`,
`encryptable_record.rb:69-76`). The simple `{ encrypt, decrypt }` pair and the
shim that adapts it are trails-only. Surfaced by trails#8004. Re-pointed here
by `retire-convergeable-receipts-citing-done-stories`.

## Acceptance criteria

- `encryptor:` takes the full `EncryptorLike` contract only.
  `LegacyEncryptorShim`, `shimUnlessFullEncryptor`, `EncryptorOptionLike` and
  the `Encryptor` alias are deleted, and callers pass a full encryptor.
- `git grep retire-legacy-encryptor-shim-option-surface` returns nothing.
