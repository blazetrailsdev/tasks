---
title: "serialize-encrypts-decorator-ordering"
status: in-progress
updated: 2026-07-21
rfc: "0055-serialization-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5033
claim: "2026-07-21T18:20:16Z"
assignee: "serialize-encrypts-decorator-ordering"
blocked-by: null
closed-reason: null
---

## Context

Found while closing `encrypted-binary-column-text-ciphertext-roundtrip` (RFC
0055). That story's premise — an encrypted binary column can't round-trip a
text ciphertext on PG (`bytea`) / MariaDB (`BLOB`) — turned out to be **false**:
`EncryptedAttributeType.textToDatabaseType` / `databaseTypeToText`
(`packages/activerecord/src/encryption/encrypted-attribute-type.ts`) already
Latin-1 bridge the payload, and the two `logo` asserts in `encrypts normalized
data` now pass on sqlite + PG + MySQL.

What actually keeps `serialized binary data can be encrypted` skipped
(`packages/activerecord/src/encryption/encryptable-record.test.ts`) is
**decorator ordering**, exposed once the test was switched off the bespoke
string-typed factories onto the canonical Rails fixtures
`EncryptedBookWithSerializedFirstBinary` / `...SecondBinary`
(`packages/activerecord/src/test-helpers/models/book-encrypted.ts`, mirroring
`vendor/rails/activerecord/test/models/book_encrypted.rb:78-83`).

Rails (`activemodel/lib/active_model/attribute_registration.rb:23-34`) replays
pending decorators in **declaration order** over a seed built from the reflected
column type, so `serialize :logo, coder: JSON` + `encrypts :logo` yields
`EncryptedAttributeType(Serialized(Bytea))`.

Trails diverges twice, verified by instrumenting the decorators against a live
PG stack:

1. The decorators replay **reversed** — `serialize`'s decorator receives an
   `EncryptedAttributeType`, producing `Serialized(Encrypted(...))`.
2. `serialize`'s decorator is also seeded from the **pre-reflection**
   `ValueType`, so `Serialized#subtype.isBinary()` is `false` and the
   binary bridge in `Serialized.deserialize`
   (`packages/activerecord/src/type/serialized.ts:268-280`) never fires. The
   JSON coder then receives raw bytes and `cast()` returns a `Uint8Array` of
   the JSON text instead of the array.

Net effect on PG: the stored plaintext is `{"0":91,"1":34,...}` — a
`JSON.stringify` of a byte array — and the read value is a `Uint8Array`, not
the round-tripped array Rails asserts.

## Acceptance criteria

- Pending decorators replay in declaration order, over a seed built from the
  reflected column type, matching `attribute_registration.rb`.
- `EncryptedBookWithSerializedFirstBinary` and `...SecondBinary` both resolve to
  `EncryptedAttributeType(Serialized(<binary column type>))`.
- Un-skip `serialized binary data can be encrypted` in
  `packages/activerecord/src/encryption/encryptable-record.test.ts` (test name
  unchanged) and remove its `TRACKED-PENDING-CONVERGENCE` comment.
- Passes on sqlite + CI PG/MySQL(MariaDB).
