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

## Also in scope: fix serialized-binary logo round-trip (unskip a test)

`EncryptedBookWithSerialized{First,Second}Binary` already ride canonical
`encrypted_books.logo` (binary), matching Rails. But the test
`encryptable-record.test.ts > "serialized binary data can be encrypted"` is
`it.skip`-ped (tracked-pending-convergence): these fixtures store a JSON-_text_
encrypted message via `_JsonArrayType` (a string castType, so
`EncryptedAttributeType.isBinary()` is false and the bytea/BLOB round-trip
coercion never runs). On PG/MariaDB the ciphertext returns as raw bytes and
decryption throws `hash without payload`; SQLite is loose so it passes. Fix the
round-trip (model `logo` as binary end-to-end — the canonical `book-encrypted.ts`
uses `serialize("logo", { coder: JSON })` on a reflected binary column — or
decode the DB value to a string before the text serializer), then remove the
`it.skip`. A naive `attribute("logo","binary") + serialize({coder: JSON})` in the
fresh factory double-encodes; the type-stack interaction needs care.
