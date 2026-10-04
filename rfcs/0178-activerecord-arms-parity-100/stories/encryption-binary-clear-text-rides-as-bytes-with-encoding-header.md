---
title: "activerecord: encrypted binary clear text rides as bytes with the encoding header"
status: done
updated: 2026-10-04
rfc: "0178-activerecord-arms-parity-100"
cluster: arms
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: trails#8492
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' encryption pipeline carries a binary column's clear text as a Ruby
`String` tagged `ASCII-8BIT`, and the tag rides in the message:

- `Cipher#encrypt` stores `message.headers.encoding` when the clear text is not
  UTF-8 (`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/cipher.rb:15-19`).
- `Cipher#decrypt` restores it with
  `force_encoding(encrypted_message.headers.encoding || DEFAULT_ENCODING)` (`cipher.rb:25-29`).
- `Encryptor#compress` / `#uncompress` carry `data.encoding` across the
  compressor (`encryptor.rb:97-115`).

trails has one JS `string` type, so the port carries binary clear text as a
latin1-decoded `string` instead, and converts at the type boundary. Three
conversions in `packages/activerecord/src/encryption/encrypted-attribute-type.ts`
exist only for that representation and have no Rails counterpart:

- `serializeWithCurrent` (`encrypted_attribute_type.rb:119-123`): Rails is
  `encrypt(casted_value.to_s)`. trails branches on whether `rbObjAsString`
  answered a `Uint8Array` (a `Binary::Data`) and decodes it as latin1. This is
  the one invented `if` left on the file, receipted
  `@inventedArm if — CONVERGEABLE` against this story.
- `textToDatabaseType` (`encrypted_attribute_type.rb:155-161`): Rails is
  `ActiveModel::Type::Binary::Data.new(value)`. trails first re-encodes `value`
  from latin1 to bytes.
- `databaseTypeToText` (`encrypted_attribute_type.rb:163-170`): Rails is
  `binary_cast_type.deserialize(value)`. trails decodes the answer as latin1.

`Cipher#encrypt` / `#decrypt` in `encryption/cipher.ts` port neither the
`headers.encoding` write nor the `force_encoding` read, and
`Encryptor#uncompressIfNeeded` (`encryption/encryptor.ts`) decodes every
decrypted payload as UTF-8, which is why raw bytes cannot ride through today.
`Compressor#inflate` (`encryption/config.ts`) answers a `string` for the same
reason.

Related draft: `encryption-encoding-helpers-fold-into-string-encode-and-header-reads`.

## Acceptance criteria

- [ ] Binary clear text rides the encryptor as bytes: `Encryptor#encrypt` /
      `#decrypt`, `Cipher#encrypt` / `#decrypt` and the compressor accept and
      answer `string | Bytes`, and `Cipher` ports the `headers.encoding` write
      and the `force_encoding` read (`cipher.rb:15-29`).
- [ ] `serializeWithCurrent` is `this.encrypt(toS(castedValue))` with no type
      branch, and its `@inventedArm if` receipt is deleted.
- [ ] `textToDatabaseType` is `new BinaryData(value)` and `databaseTypeToText`
      is `binaryCastType.deserialize(value)`, with no latin1 conversion.
- [ ] `binary data can be encrypted`, `binary data can be encrypted uncompressed`
      and `serialized binary data can be encrypted`
      (`encryption/encryptable-record.test.ts`) pass on SQLite, PostgreSQL and MySQL.
- [ ] `pnpm parity:api:arms:report --package=activerecord --direction=invented`
      shows no row for `encryption/encrypted-attribute-type.ts`.
