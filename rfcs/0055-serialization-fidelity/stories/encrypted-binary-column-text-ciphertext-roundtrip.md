---
title: "Encrypted binary column can't round-trip text ciphertext (restore logo asserts, un-skip serialized-binary)"
status: ready
updated: 2026-07-08
rfc: "0055-serialization-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced (again) while converging `encrypts normalized data` onto the canonical
reflection-based models in PR #4791 (story
`reflected-encrypted-column-schema-default-deserialize`, RFC 0055). Rails'
`encryptable_record_test.rb` "encrypts normalized data" asserts BOTH halves:

```ruby
assert_encrypted_attribute EncryptedBookNormalizedFirst.create!(name: "Book"), :name, "book"
assert_encrypted_attribute EncryptedBookNormalizedSecond.create!(name: "Book"), :name, "book"
assert_encrypted_attribute EncryptedBookNormalizedFirst.create!(logo: "Book"), :logo, "book"
assert_encrypted_attribute EncryptedBookNormalizedSecond.create!(logo: "Book"), :logo, "book"
```

Trails only rides the `name` half; the two `logo` (canonical `binary` column)
assertions stay commented as `TRACKED-PENDING-CONVERGENCE` in
`packages/activerecord/src/encryption/encryptable-record.test.ts`. Root cause:
an encrypted **binary** column can't round-trip a **text** ciphertext on
PG (`bytea`) / MariaDB (`BLOB`) — the same gap behind the already-skipped
`serialized binary data can be encrypted` test. The message serializer emits a
JSON/base64 text payload; writing it into a binary column and reading it back
yields raw bytes, so `MessageSerializer.load` fails ("hash without payload").
SQLite is loose (stores text in BLOB) so it passes there. See memory note
`text ciphertext can't round-trip binary column`.

Relevant Rails/trails:

- `vendor/rails/activerecord/test/cases/encryption/encryptable_record_test.rb`
  ("encrypts normalized data")
- `packages/activerecord/src/encryption/encrypted-attribute-type.ts`
  (`textToDatabaseType` / `databaseTypeToText` binary path)
- `packages/activerecord/src/encryption/encryptable-record.test.ts`
  (commented `logo` asserts; `serialized binary data can be encrypted` skip)

## Acceptance criteria

- Encrypted binary columns round-trip a text ciphertext on sqlite + PG + MariaDB
  (the serializer's text payload survives a `bytea`/`BLOB` write→read).
- Restore the two `logo` assertions in `encrypts normalized data` to match Rails
  verbatim (`create!(logo: "Book")` → `:logo` == `"book"`).
- Un-skip `serialized binary data can be encrypted` (the sibling covered by the
  same gap), or, if it exercises a distinct sub-case, note why it stays skipped.
- Passes on sqlite + CI PG/MySQL(MariaDB).
