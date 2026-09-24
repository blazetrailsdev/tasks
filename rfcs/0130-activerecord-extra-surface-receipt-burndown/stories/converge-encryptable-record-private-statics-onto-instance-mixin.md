---
title: "converge-encryptable-record-private-statics-onto-instance-mixin"
status: done
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 8
pr: trails#8027
claim: "2026-09-24T13:07:19Z"
assignee: "test-bodies-lease-connection-per-test"
blocked-by: null
closed-reason: null
---

## Context

After `relocate-encryption-hooks-onto-encryptable-record`, `Base` mixes in the
public `EncryptableRecord` surface (`encrypts`, `isEncryptedAttribute`,
`ciphertextFor`, `encrypt`, `decrypt`). Two of Rails' private instance methods
in the same concern are still ported as record-taking statics on
`class EncryptableRecord` (`packages/activerecord/src/encryption/encryptable-record.ts`):

- `static _createRecord(record, attributeNames)` (`:90-97`) mirrors
  `_create_record` (`vendor/rails/activerecord/lib/active_record/encryption/encryptable_record.rb:178-185`),
  which unions `self.class.encrypted_attributes` into `attribute_names` and
  calls `super`. **Nothing in trails calls it**, so Rails' "always persist
  encrypted attributes, because an attribute might be encrypting a column
  default value" behavior is missing on create.
- `static cantModifyEncryptedAttributesWhenFrozen(record)` (`:100-112`) mirrors
  `cant_modify_encrypted_attributes_when_frozen` (`:223-227`). Base's
  `included do` validate (`:12`, now in `base.ts` next to
  `classAttribute(Base, "encryptedAttributes")`) calls it through a lambda where
  Rails names the method with a symbol.

## Acceptance criteria

- `_createRecord` is a `this`-typed override mixed into Base that calls the
  persistence `_createRecord` as its `super`, guarded by
  `has_encrypted_attributes?` exactly like `:179-183`. A test ports the Rails
  case that relies on it (encrypted column-default persisted on create).
- `cantModifyEncryptedAttributesWhenFrozen` is a `this`-typed instance function
  iterating `this.constructor.encryptedAttributes` and reading
  `changedAttributes` (`:224-226`), and the validate names it as Rails does.
- The static forms on `class EncryptableRecord` are deleted. Existing trails
  test names stay unchanged, and only their bodies are updated.
