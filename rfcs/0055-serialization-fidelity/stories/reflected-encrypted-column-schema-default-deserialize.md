---
title: "Reflected encrypted column with non-null schema default fails to decrypt (default seeded via deserialize)"
status: draft
updated: 2026-07-02
rfc: "0055-serialization-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging the encryption `makeFreshModel` tests to Rails fixture
models (PR #4419, story converge-encryption-makefreshmodel-to-rails-fixture-pattern).

A model whose encrypted attribute is obtained by **schema reflection** (not an
explicit `attribute()` declaration) and whose canonical column carries a
**non-null schema default** fails to decrypt on the first read of a freshly
created record:

```text
DecryptionError: Failed to deserialize encrypted message
  at MessageSerializer.load (message-serializer.ts:33)
  at EncryptedAttributeType.deserialize (encrypted-attribute-type.ts:100)
  at FromDatabase.typeCast (activemodel/src/attribute.ts:283)
```

Root cause: the column default (e.g. `encrypted_books.name` default
`<untitled>`, a plaintext string) is seeded as a **FromDatabase** attribute
value, so the first read runs it through `EncryptedAttributeType.deserialize`
→ `decrypt` → the plaintext default is not a valid encrypted message → throws.

Reproduced against the canonical `models/book-encrypted.ts` classes
(`EncryptedBook`, `EncryptedBookNormalizedFirst/Second`) over a warmed handler
connection. An **explicit** `attribute("name","string", { default })`
declaration sidesteps it (the default is applied via user-cast, not
deserialize), which is why PR #4419 rode same-named factory helpers instead of
the reflection-based `models/` classes. Non-defaulted reflected encrypted
columns (e.g. `posts.title` on `EncryptedPost`) are unaffected.

This mirrors the enum fix in af6595b70 ("seed enum column default from schema
(deserialize), not user-cast") — the same seam, opposite direction: encrypted
columns need the default seeded via **user-cast / plaintext**, not via the
encrypted type's deserialize.

Relevant files:

- `packages/activerecord/src/encryption/encrypted-attribute-type.ts:98-101` (deserialize)
- `packages/activerecord/src/test-helpers/models/book-encrypted.ts`
- default-seeding path in `model-schema.ts` / `_defaultAttributes` (schema-cache warm)

## Acceptance criteria

- A reflected encrypted attribute on a column with a non-null schema default
  reads back correctly for a newly built/created record (no
  `Failed to deserialize encrypted message` on first read).
- Seed encrypted-column schema defaults through the plaintext/user-cast path,
  not the encrypted type's `deserialize`.
- Switch the encryption `encrypts normalized data` test (and any siblings) to
  ride the canonical `models/` classes (`EncryptedBookNormalizedFirst/Second`)
  once the fix lands, retiring the same-named factory helpers added in #4419.
- Passes on sqlite + CI PG/MySQL.
