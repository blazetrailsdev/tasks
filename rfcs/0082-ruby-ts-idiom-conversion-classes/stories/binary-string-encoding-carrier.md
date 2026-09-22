---
title: "binary-string-encoding-carrier"
status: draft
updated: 2026-09-22
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A Ruby String carries an encoding (`"\x93\xfa".b` is ASCII-8BIT). A JS string does not, so a binary string cannot be told apart from the UTF-8 string `"\u0093ú"`. The only way to carry raw bytes is a `Uint8Array`, and `ImmutableString#castValue` (`packages/activemodel/src/type/immutable-string.ts:39`) turns it into `String(bytes)` (`"72,101,..."`). Rails' string cast keeps the bytes and their encoding.

Blocks `assertions-uniqueness-singleton-and-forced-encoding-residue` item 2: `vendor/rails/activerecord/test/cases/encryption/encryptable_record_test.rb:334-337` saves `"Hello \x93\xfa".b` and expects `"Hello ��"`, which comes from `force_encoding_if_needed` (`vendor/rails/activerecord/lib/active_record/encryption/encryptor.rb:164-170`). That method only converts when `value.encoding != forced_encoding`. trails' `Encryptor#forceEncodingIfNeeded` (`packages/activerecord/src/encryption/encryptor.ts:294`) and the invented duplicate `EncryptedAttributeType#_applyForcedEncoding` (`encrypted-attribute-type.ts:292`) can't make that check. The test sets ASCII and expects `"Hello ??"` instead.

## Acceptance criteria

- A binary-String convention is chosen (e.g. a `Uint8Array` survives the string type's cast and serialize) and documented.
- `forceEncodingIfNeeded` mirrors `encryptor.rb:164-170`: binary input is transcoded to the forced encoding with invalid/undef bytes replaced (U+FFFD for UTF-8). The `_applyForcedEncoding` duplicate is removed.
- `forced encoding for deterministic attributes will replace invalid characters` uses the Rails input and expects `"Hello ��"`, and its row leaves `pnpm parity:test -- --package activerecord --assertions --missing`.
