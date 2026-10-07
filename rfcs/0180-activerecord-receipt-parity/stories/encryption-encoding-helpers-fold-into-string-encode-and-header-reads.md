---
title: "activerecord: encryption/encoding-helpers.ts folds into String#encode and bare header reads"
status: ready
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-subsystems-part-1` audit: the receipts below were `PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged `CONVERGEABLE` onto this story.

`packages/activerecord/src/encryption/encoding-helpers.ts` has no Rails file. It exports three
functions, each `@noRailsEquivalent`:

| Export                                    | Callers                                                                                                          | What Rails writes there                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `normalizeEncoding`, `replaceUnencodable` | `encryption/encryptor.ts` `forceEncodingIfNeeded`                                                                | `value.encode(forced_encoding_for_deterministic_encryption, invalid: :replace, undef: :replace)`, guarded by `value.encoding != forced_encoding_for_deterministic_encryption` (`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/encryptor.rb:164-170`)                                                                             |
| the same two                              | `encryption/encrypted-attribute-type.ts` `_applyForcedEncoding`                                                  | nothing: `encrypted_attribute_type.rb` has no such method, and the encryptor is the only place Rails forces an encoding                                                                                                                                                                                                                          |
| `headerString`                            | `encryption/key-provider.ts` `decryptionKeys`, `encryption/envelope-encryption-key-provider.ts` `decryptDataKey` | a bare header read: `keys_grouped_by_id[encrypted_message.headers.encrypted_data_key_id]` (`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/key_provider.rb:32-38`) and `encrypted_message.headers.encrypted_data_key` (`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/envelope_encryption_key_provider.rb:40-44`) |

`String#encode` and `String#encoding` are Ruby core (`vendor/ruby/v3.3.11/transcode.c`,
`vendor/ruby/v3.3.11/string.c`). ruby-compat already holds the neighbouring ports
(`packages/ruby-compat/src/string/force-encoding.ts`: `forceEncoding`, `isValidEncoding`), so the
transcoding belongs there at its MRI name, not in an activerecord helper file.
`headerString` coerces a header that may be a `Buffer` to a string; Rails reads the header as it is,
so the coercion is either dead or covers a deserialization gap in `MessageSerializer` /
`Properties` that should be fixed where the header is built.

## Acceptance criteria

- [ ] `Encryptor#forceEncodingIfNeeded` is `encryptor.rb:164-170`: the three-part guard and a call to a ruby-compat `encode(value, encoding, { invalid: ":replace", undef: ":replace" })` (MRI citation and `@noRailsEquivalent PERMANENT` receipt in ruby-compat, listed in its README).
- [ ] `EncryptedAttributeType#_applyForcedEncoding` is deleted, or the PR body names the Rails line it ports.
- [ ] `KeyProvider#decryptionKeys` and `EnvelopeEncryptionKeyProvider#decryptDataKey` read the header directly; if a header can arrive as bytes, the fix is in the serializer that builds it.
- [ ] `encryption/encoding-helpers.ts` is deleted and `pnpm parity:api:extra:gate` stays rowless.

## Verification

```bash
pnpm vitest run packages/activerecord/src/encryption && pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate
```
