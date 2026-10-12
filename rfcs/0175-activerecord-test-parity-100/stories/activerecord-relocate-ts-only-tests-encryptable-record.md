---
title: "activerecord: move the 17 TS-only tests in encryption/encryptable-record.test.ts to the .trails sibling"
status: draft
updated: 2026-10-12
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 490
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `activerecord-relocate-ts-only-tests-encryption`, whose PR moved the ten
smaller encryption files and stopped at the LOC ceiling: a relocation counts once as a
deletion and once as an addition, so the parent story's 436 est-loc was about a third
of the real diff.

Every Rails test in the file is already matched (0 missing in `pnpm parity:test`), so no
extra here is a Rails test under a drifted name. Each one is TS-only and moves unchanged.
The sibling convention is a top-level `describe("<Rails describe> (trails)")`.

Do not add the sibling to `eslint/no-explicit-any-test-exclude.json`: a moved `as any`
is retyped, not allowlisted.

`packages/activerecord/src/encryption/encryptable-record.test.ts` has 17 extras
(`vendor/rails/v8.0.2/activerecord/test/cases/encryption/encryptable_record_test.rb`
has 51 tests, all matched). The sibling `encryptable-record.trails.test.ts` exists.

In the main `ActiveRecord::Encryption::EncryptableRecordTest` describe (10 tests):

- `isEncryptedAttribute identifies encrypted vs plain attributes`
- `threads the reflected column default so a plaintext default deserializes without decrypting`
- `threads the true column default, not an attribute() override, into the encrypted type`
- `when ignore_case: true is declared before the attributes, the original_<name> reader still decrypts (replay-safe)`
- `EncryptableRecord.validateEncryptionAllowed throws when encryption is frozen`
- `EncryptableRecord.validateEncryptionAllowed does not throw when encryption is not frozen`
- `EncryptableRecord.cantModifyEncryptedAttributesWhenFrozen adds errors for changed encrypted attrs`
- `EncryptableRecord.cantModifyEncryptedAttributesWhenFrozen adds no errors for unchanged attrs`
- `EncryptableRecord.encryptAttributes writes ciphertext to DB and keeps plaintext in memory`
- `EncryptableRecord.decryptAttributes stores plaintext in DB`

These fit the sibling's first describe, which already has the same
`snapshotEncryptionConfig` / `configureEncryption` hooks.

Two whole describes at the end of the file (7 tests) move with their hooks and the
`makeMockModel` helper:

- `EncryptableRecord.encryptAttribute — scheme-based ignore_case wiring` (5 tests)
- `EncryptableRecord — ignore_case original_<name> column requirement` (2 tests)

The sibling then needs `makeEncryptedPost` and `assertEncryptedAttribute` from
`./test-helpers.js`; `cantModifyEncryptedAttributesWhenFrozen`, `decryptAttributes`,
`encryptAttributes`, `encrypts` and `validateEncryptionAllowed` from
`./encryptable-record.js`; `generatedAttributeMethods`; `AttributeRegistration` and
`Model` from activemodel; and `include` from activesupport. The moved tests carry
`as any` casts.

## Acceptance criteria

- [ ] Every extra listed above lives in the `.trails.test.ts` sibling with its body unchanged, apart from an adaptation named above.
- [ ] No Rails-named test is renamed or reworded.
- [ ] The file reports 0 extra in `pnpm parity:test`.
- [ ] Imports and helpers left unused in the Rails-named file are removed; `pnpm eslint` and `pnpm typecheck` are clean.

## Verification

```bash
pnpm parity:test --package activerecord --sort-extra --min-extra=1
```
