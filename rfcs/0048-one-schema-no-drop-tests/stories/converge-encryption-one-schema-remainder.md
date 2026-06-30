---
title: "converge-encryption-one-schema-remainder"
status: ready
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to `converge-encryption-one-schema` (RFC 0048). That story's PR
converged only `unencrypted-attributes.test.ts` (the small, clean file) to a
faithful Rails port riding canonical `TEST_SCHEMA.posts` + the official
`EncryptedPost` model. The remaining 5 encryption test files still import the
bespoke `encryption/test-helpers.ts` factories (`freshAdapter`,
`makeEncrypted*`, bespoke `ENCRYPTION_SCHEMA` with invented tables like
`encrypted_posts`, `encrypted_authors`) and must be converted all-or-nothing per
file, one PR per file under the 500-LOC ceiling.

The RFC 0048 **Convergence contract** is binding: mirror the named Rails source
word-for-word (same describe/it names + assertions), ride canonical `TEST_SCHEMA`

- official `test-helpers/models/*` (the `book-encrypted.ts` / `post-encrypted.ts`
  / `author-encrypted.ts` / `traffic-light-encrypted.ts` models already exist and
  ride `encrypted_books`) + real fixtures only. No bespoke tables. Where a faithful
  port surfaces a trails impl gap, fix the impl or file a deviation under
  `0023-surfaced-deviations` and mark tracked-pending-convergence — do NOT bend the
  test.

Known impl gap surfaced already: the MessagePack text-column case
(`encryptable_record_message_pack_serialized_test.rb` "text columns cannot be
serialized with message pack") raises `Decryption` ("Failed to load MessagePack
message") on read instead of Rails' `Encoding` error on write when the encrypted
attribute rides a schema-reflected (not explicitly `attribute()`-declared)
string column. `encrypted-attribute-type.ts:331` gates the throw on
`encryptor.isBinary() && !castType.isBinary()`; investigate why the reflected
`name` castType is not seen as non-binary at encrypt time. The bespoke
`makeMsgPackTextBook` worked only because it pre-declared `attribute("name",
"string")`. Likely a deviation to file or an impl fix.

Note: `post-encrypted.ts`'s `MutableDerivedSecretKeyProvider` for `body` derives
its key eagerly at class-init, so encryption config must be set (via
`configureEncryption()`) before the model is imported — the shipped
unencrypted-attributes file does this with a lazy `await import()` in `beforeAll`.

### Files -> Rails source (one PR per file)

- `encryption/encryptable-record-message-pack-serialized.test.ts` -> `vendor/rails/activerecord/test/cases/encryption/encryptable_record_message_pack_serialized_test.rb`
- `encryption/encryptable-record-api.test.ts` -> `.../encryption/encryptable_record_api_test.rb`
- `encryption/encryption-schemes.test.ts` -> `.../encryption/encryption_schemes_test.rb`
- `encryption/encryptable-record.test.ts` -> `.../encryption/encryptable_record_test.rb`
- `encryption.test.ts` -> NO 1:1 Rails counterpart (no `encryption_test.rb`); it is bespoke. Delete it and port the real Rails cases covering the behavior, or fold coverage into the named encryption/ files.

The bespoke `encryption/test-helpers.ts` (config helpers + `assertEncryptedAttribute` are fine to keep; the `makeEncrypted*` model factories + `ENCRYPTION_SCHEMA` bespoke tables + `freshAdapter` must die once all importers are converted).

## Acceptance criteria

- [ ] Each of the 5 files above is a faithful Rails port riding canonical schema + official models + real fixtures; test names/assertions match Rails verbatim.
- [ ] Bespoke `makeEncrypted*` factories, `ENCRYPTION_SCHEMA`, and `freshAdapter` removed from `encryption/test-helpers.ts` once no test imports them.
- [ ] Impl gaps fixed or filed as deviations (0023) + tracked-pending-convergence; no bent tests.
- [ ] One PR per file under 500 LOC; all-or-nothing per file.
