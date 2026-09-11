---
title: "encryption-converge-pending-encryptions-to-decorate-attributes"
status: ready
updated: 2026-09-11
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `encrypts` (`vendor/rails/activerecord/lib/active_record/encryption/encryptable_record.rb`,
`encrypt_attribute`) wraps the attribute's type through `decorate_attributes([name]) do |name,
cast_type| EncryptedAttributeType.new(scheme:, cast_type:, default:) end`, so
`type_for_attribute(name)` returns the `EncryptedAttributeType` itself as the outermost type.

trails diverges in two linked places:

- `applyPendingEncryptions` (`packages/activerecord/src/encryption.ts`) — a queue of pending
  encryptions on `_pendingEncryptions` applied later, instead of `decorate_attributes`.
- `encryptedTypeOf` (`packages/activerecord/src/encryption/encryptable-record.ts`) — walks
  `subtype`/`castType` to find the `EncryptedAttributeType`, because in trails a serialized /
  wrapped type can end up outside it. Callers: `deterministicEncryptedAttributes`,
  `encryptedAttribute`, `EncryptedUniquenessValidator.validateEach`, extended queries.

Both carry `@noRailsEquivalent CONVERGEABLE encryption-converge-pending-encryptions-to-decorate-attributes`.
See also `converge-enum-attribute-to-decorate-attributes` for the sibling decorate_attributes port.

## Acceptance criteria

- `encrypts` decorates via `decorateAttributes` as at `encryptable_record.rb` `encrypt_attribute`;
  `applyPendingEncryptions` and its `encryption-hooks.ts` plumbing are deleted.
- `typeForAttribute` of an encrypted attribute returns the `EncryptedAttributeType`, so
  `encryptedTypeOf` is deleted and callers read the type directly as Rails does.
- Both receipts removed; extra-surface mark tightened.
