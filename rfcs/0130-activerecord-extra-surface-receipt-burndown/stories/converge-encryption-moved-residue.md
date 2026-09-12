---
title: "converge-encryption-moved-residue"
status: draft
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
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

`receipt-moved-encryption-subtree` (trails#TBD) burnt the encryption area's 32 moved extras
down by deleting, relocating and extractor-crediting what it could. Seven names survived as
`@noRailsEquivalent CONVERGEABLE` receipts pointing here. Each is a distinct divergence with
its own Rails anchor; none is a TypeScript language shortcoming.

- `encryption.ts` `isEncryptedAttribute` — a SECOND `encrypted_attribute?`
  (`vendor/rails/activerecord/lib/active_record/encryption/encryptable_record.rb:146`). trails
  already ports that method faithfully as `encryptedAttribute` in
  `encryption/encryptable-record.ts:250`; the module-level duplicate walks the
  `_pendingEncryptions` prototype chain instead of reading `encrypted_attributes`. Converge by
  folding its three test call sites onto `encryptedAttribute` and deleting it. Its receipt is
  mirrored by the FILE-level receipt on `encryption/index.ts`, which only re-exports it — that
  receipt comes out in the same change.
- `encryption/encrypted-attribute-type.ts` `name` — Rails' `EncryptedAttributeType` has no
  `name`; `ActiveModel::Type::Value` answers the type's identity through `type`
  (`encrypted_attribute_type.rb:15` delegates `:type` to `cast_type`). The field is trails'
  type-registry key.
- `encryption/encrypted-attribute-type.ts` `serializeCastValue` — Rails does NOT include
  `ActiveModel::Type::SerializeCastValue` here (`encrypted_attribute_type.rb:10-11` is
  `< ::ActiveModel::Type::Value` plus `Helpers::Mutable`), so `serialize_cast_value` is simply
  undefined on the type and `SerializeCastValue.serialize`
  (`activemodel/lib/active_model/type/serialize_cast_value.rb:29-33`) falls through to
  `type.serialize(value)` — because `itself_if_serialize_cast_value_compatible` (`:37-39`)
  returns nil for a type that never included the module.

  **The override is load-bearing in trails for a reason that lives in activemodel, not here.**
  trails' `ActiveModel::Type::Value` defines `serializeCastValue(value) { return value; }` — an
  IDENTITY — unconditionally (`packages/activemodel/src/type/value.ts:104-106`), where Rails'
  `Type::Value` defines no such method at all; Rails adds `DefaultImplementation` only to
  classes that include the module (`serialize_cast_value.rb:22`). So deleting the encryption
  override would silently return the PLAINTEXT instead of the ciphertext.

  Converging it therefore starts in activemodel: `ValueType` must stop defining an identity
  `serializeCastValue`, matching `Type::Value`, so the dispatcher falls through to `serialize`
  for every type that did not opt in. That touches every type in the repo, which is why it is
  not a drive-by — and it is a real latent bug, not just extra surface: any other type whose
  `serialize` does work and which never opted into the module is currently serialized by the
  identity instead.

- `encryption/extended-deterministic-queries.ts` `valueForDatabase` — Rails'
  `AdditionalValue` (`extended_deterministic_queries.rb:134-146`) declares only
  `attr_reader :value, :type`, `initialize` and a private `process`.
- `encryption/envelope-encryption-key-provider.ts` `constructor` — Rails'
  `EnvelopeEncryptionKeyProvider` (`envelope_encryption_key_provider.rb`) defines no
  `initialize`; it reads the primary key provider from
  `ActiveRecord::Encryption.config`. The injected `primaryKeyProvider` exists only for
  `envelope-encryption-key-provider.test.ts`.
- `encryption/errors.ts` `Base#constructor` — Rails' error classes are bare
  (`encryption/errors.rb:6-12`, `class Decryption < Base; end`) with no `initialize` and no
  default messages. trails invents a default message per class, which also means a raise site
  can omit the message Rails states. Converge by passing Rails' message at each raise site and
  deleting the constructors.

## Acceptance criteria

- [ ] Each name above is deleted or relocated, and its `@noRailsEquivalent CONVERGEABLE`
      receipt comes out with it.
- [ ] `pnpm parity:api:extra --package activerecord` reports 0 extras for
      `encryption.ts`, `encryption/index.ts`, `encryption/encrypted-attribute-type.ts`,
      `encryption/extended-deterministic-queries.ts`,
      `encryption/envelope-encryption-key-provider.ts` and `encryption/errors.ts`.
- [ ] `pnpm parity:api:extra:tighten` writes activerecord's `total` mark DOWN.
