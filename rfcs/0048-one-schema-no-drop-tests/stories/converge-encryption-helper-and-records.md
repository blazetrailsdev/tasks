---
title: "converge-encryption-helper-and-records"
status: draft
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

Follow-up to `converge-encryption-one-schema` (PR converting `encryption.test.ts`).
The remaining 5 DB-backed encryption test files all share the bespoke
`ENCRYPTION_SCHEMA` declared in
`packages/activerecord/src/encryption/test-helpers.ts` (the `installEncryptionSchema` /
`freshAdapter` path) and per-test bespoke tables, so they must be converged together —
they cannot be split file-by-file without first converging the shared helper.

Files still on bespoke tables:

- `packages/activerecord/src/encryption/encryptable-record-api.test.ts`
- `packages/activerecord/src/encryption/encryptable-record-message-pack-serialized.test.ts`
- `packages/activerecord/src/encryption/encryptable-record.test.ts`
- `packages/activerecord/src/encryption/encryption-schemes.test.ts`
- `packages/activerecord/src/encryption/unencrypted-attributes.test.ts`

Bespoke tables in `ENCRYPTION_SCHEMA` (test-helpers.ts:155) that need converging to the
Rails table each fixture class actually uses in
`vendor/rails/activerecord/test/models/book_encrypted.rb` /
`post_encrypted.rb` / `traffic_light.rb` and `schema.rb`:

- `encrypted_posts` → Rails `EncryptedPost` uses table `posts` (canonical `posts` exists).
- `encrypted_authors` → Rails `EncryptedAuthor` uses table `encrypted_authors`
  (NOT yet in canonical `TEST_SCHEMA`; add `create_table :encrypted_authors` —
  `name` limit 1024 — to mirror schema.rb).
- `encrypted_book_with_custom_compressors`,
  `book_that_will_fail_to_encrypt_names` → Rails variants all use table
  `encrypted_books` (canonical, already present). Set `_tableName = "encrypted_books"`.
- `encrypted_traffic_light_with_store_states` → Rails uses `traffic_lights`
  (canonical exists; has `state`/`long_state`).
- `encrypted_book_with_serialized_first_binaries`,
  `encrypted_book_with_serialized_second_binaries`,
  `encrypted_book_with_binary_message_pack_serializeds` → Rails all use
  `encrypted_books`.

Prefer the canonical model `packages/activerecord/src/test-helpers/models/book-encrypted.ts`
(EncryptedBook* classes already on `encrypted_books`) over re-deriving the
`make*`factories where possible. Replace the`freshAdapter()`/per-test-table
pattern with `setupHandlerSuite`+`useHandlerTransactionalFixtures`+`defineSchema(TEST_SCHEMA)`(the canonical full schema), the same pattern`encrypted-fixtures.test.ts` already uses successfully on sqlite/pg/maria.

## Acceptance criteria

- Converge all 5 files + the shared `ENCRYPTION_SCHEMA` in `encryption/test-helpers.ts`
  to canonical `TEST_SCHEMA` tables/columns; no bespoke tables, no invented columns.
  Match Rails table/column names exactly. Add `encrypted_authors` to canonical
  `TEST_SCHEMA` if needed.
- Each file passes under `AR_ONE_SCHEMA=1` on sqlite, postgres, and maria.
- Test names stay verbatim from Rails.
- Split across PRs under the 500-LOC ceiling as needed (the 5 files total
  ~1600 LOC; likely 2-3 PRs once the helper is converged).
