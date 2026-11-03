---
title: "Port ActionText::Encryption, EncryptedRichText and model_encryption_test"
status: draft
updated: 2026-11-03
rfc: "0219-actiontext-port"
cluster: at-models
packages: ["actiontext"]
deps: ["actiontext-record-rich-text-and-attribute"]
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

- `vendor/rails/v8.0.2/actiontext/lib/action_text/encryption.rb` (40): `encrypt` / `decrypt` wrap
  `super` in `transaction` and then encrypt or decrypt the record's
  `EncryptedRichText`s (`:7-19`); `encryptable_rich_texts` reads each
  `rich_text_association_names` entry by `send` (`:34-38`).
- `app/models/action_text/encrypted_rich_text.rb` (11): `encrypts :body`.
- Engine: `prepend ActionText::Encryption` into `ActiveRecord::Base` on load
  (`lib/action_text/engine.rb:31`). trails' `Base#encrypt` / `#decrypt` are
  async (`packages/activerecord/src/encryption/encryptable-record.ts:162-175`).
- Test: `test/unit/model_encryption_test.rb` (2).

## Acceptance criteria

- `Encryption` is a module `prepend()`ed onto `Base` whose `encrypt` /
  `decrypt` reach `EncryptableRecord` through `rbCallSuper` (RFC "Mixins and
  module `super`"); both are async and await the transaction.
- `encryptable_rich_texts`' `send(attribute_name)` reads the association
  reader by its computed name through the association API
  (`association(name).reader`), not `rbFSend`; the name set is the model's
  own reflections.
- The 2 tests pass.
