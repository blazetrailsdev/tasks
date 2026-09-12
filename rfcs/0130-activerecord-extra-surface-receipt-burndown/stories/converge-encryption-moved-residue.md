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
  `< ::ActiveModel::Type::Value` plus `Helpers::Mutable`), so the override has no Rails
  declaration; `serialize` (`:39`) is the whole surface.
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
