---
title: "activerecord: move the 23 TS-only tests in encryption/scheme.test.ts and encryptor.test.ts to the .trails siblings"
status: draft
updated: 2026-10-12
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 610
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

Two files, both with an existing sibling.

`packages/activerecord/src/encryption/scheme.test.ts` has 14 extras
(`vendor/rails/v8.0.2/activerecord/test/cases/encryption/scheme_test.rb` has 3 tests,
all matched). Everything except `validates config options when using encrypted
attributes`, `should create a encryptor well when compressor is given` and `should
create a encryptor well when compress is false` moves: the five `keyProvider ...`
tests, the nested `isSupportUnencryptedData` describe (2 tests, with its hooks),
`isFixed returns true for deterministic schemes`, the three `merge ...` tests, the two
`withContext ...` tests and `isCompatibleWith returns true when deterministic flags
match`. They fit the existing `ActiveRecord::Encryption::SchemeTest (trails)`
describe; it then needs `beforeEach`, `afterEach`, `DeterministicKeyProvider` and
`Configuration`.

`packages/activerecord/src/encryption/encryptor.test.ts` has 9 extras
(`vendor/rails/v8.0.2/activerecord/test/cases/encryption/encryptor_test.rb` has 12
tests, all matched):

- `compresses when raw compressed bytes < original even if base64(compressed) > original`
- `short strings under threshold are not compressed even when compress is enabled`
- `compress? returns the compress setting`
- `binary? returns false (delegates to the JSON serializer)`
- `deterministic encryption replaces unencodable characters based on forcedEncodingForDeterministicEncryption`
- the nested describe `default key provider from ActiveRecordEncryption.config` (1 test, with its hooks)
- `cipher delegates to the configured cipher singleton`
- `cipher reads from the current encryption context`
- `buildEncryptedMessage dispatches through cipher() for encrypt and decrypt`

The existing `ActiveRecord::Encryption::Encryptor (trails)` describe has its own
`afterEach`, so these go in a second describe,
`ActiveRecord::Encryption::EncryptorTest (trails)`, with the `generateKey` helper. The
sibling then needs `beforeEach`, `vi`, `Cipher` and `MessageSerializer`. The `cipher`
tests carry `as any` casts.

## Acceptance criteria

- [ ] Every extra listed above lives in the `.trails.test.ts` sibling with its body unchanged, apart from an adaptation named above.
- [ ] No Rails-named test is renamed or reworded.
- [ ] The file reports 0 extra in `pnpm parity:test`.
- [ ] Imports and helpers left unused in the Rails-named file are removed; `pnpm eslint` and `pnpm typecheck` are clean.

## Verification

```bash
pnpm parity:test --package activerecord --sort-extra --min-extra=1
```
