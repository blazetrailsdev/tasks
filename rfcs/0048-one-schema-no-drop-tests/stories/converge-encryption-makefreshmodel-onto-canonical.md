---
title: "Convert encryption makeFreshModel off dynamic fresh_model_N tables onto canonical tables (one-schema)"
status: ready
updated: 2026-07-02
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: ["converge-encryption-cluster-one-schema"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `converge-encryption-cluster-one-schema` (PR #4406), which converged
the encryption fixture _factories_ onto canonical tables (`posts`,
`encrypted_books`, `authors`, `traffic_lights`) and removed the bespoke
`ENCRYPTION_SCHEMA`. One divergence remains: `makeFreshModel`
(`encryption/test-helpers.ts`) creates dynamic throwaway `fresh_model_N` tables
via `defineSchema(adapter, { fresh_model_N: cols })`. Those non-canonical tables
throw `OneSchemaViolation` under `AR_ONE_SCHEMA=1`, so three files stay on the
one-schema exclude:

- `encryption/encryptable-record.test.ts` (10 callsites)
- `encryption/encryptable-record-api.test.ts` (3)
- `encryption/encryption-schemes.test.ts` (6)

(`encryptable-record-message-pack-serialized.test.ts` has no `makeFreshModel` and
is already fully canonical after #4406.)

`makeFreshModel` exists only to get a _fresh class_ that bypasses the
`encrypts` idempotency guard — it does not need a bespoke _table_. Convert it to
ride a canonical table (fresh class, subset of columns, no DDL). Shape → table
mapping observed at the callsites:

- `{title}` / `{title, body}` → `posts`
- `{name}` (author tests) → `authors`
- `{name, logo}` / `{name}` (book tests) → `encrypted_books`
- `{settings: json}` (record.test.ts "encrypts serialized attributes", NO Rails
  counterpart — trails-authored) → a canonical table with a text column, e.g.
  `to_be_linked_users.settings` (text).

## Risk to verify

Callsites share a table on purpose (`RawModel._tableName =
EncryptedAuthor2._tableName`; `PostSha256._tableName = PostSha1._tableName`) to
read one class's row through another. Moving from per-call `fresh_model_N`
isolation to a shared canonical table on the persistent worker pool means rows
accumulate across tests; deterministic `findBy({name})` matches by ciphertext,
so different custom encryptors mostly self-isolate, but this must be verified
test-by-test (esp. `encryption-schemes.test.ts` custom-encryptor/previous-context
tests). Run each of the three files after conversion.

## Acceptance criteria

- `makeFreshModel` rides canonical tables (no `fresh_model_N` DDL); one-schema
  clean.
- All three files pass on sqlite (and CI PG/MySQL).
- Coordinate with RFC 0025 `converge-encryption-test-canonical-schema` for
  `encryption.test.ts` (users.name) — not in scope here.
- No test renames.

## Also in scope: serialized-binary logo variants

`EncryptedBookWithSerializedFirstBinary` / `...SecondBinary` still ride bespoke
`text` tables (`encrypted_book_with_serialized_{first,second}_binaries`) instead
of canonical `encrypted_books.logo` (binary), which is where Rails puts them.
PR #4406 tried the canonical binary column and CI (PG + MariaDB) failed with
`DecryptionError: Invalid data format: hash without payload`: these fixtures
store a JSON-_text_ encrypted message (string, via `_JsonArrayType` + default
MessageSerializer), and a string round-tripped through a bytea/BLOB column comes
back as raw bytes. Ruby dodges this (String is a byte-string); trails' string-
attribute-on-binary-column path does not. The message-pack variant is unaffected
(genuine binary end-to-end). Converging these needs the encrypted-binary
round-trip fixed (decode bytea/BLOB → utf-8 before the text serializer, or model
logo as binary end-to-end) — an impl change, not just a table repoint.
