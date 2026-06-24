---
title: "ar-encryption-surface"
status: done
updated: 2026-06-24
rfc: "0045-data-layer-api-compare-100"
cluster: ar-feature
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 4047
claim: "2026-06-24T02:01:44Z"
assignee: "ar-encryption-surface"
blocked-by: null
---

## Context

The ActiveRecord::Encryption surface is below 100% across four files:

- `encryption.ts` (16/21): `config`, `encrypted_attribute_declaration_listeners`/`=`,
  `default_context`/`=`.
- `encryption/encrypted-attribute-type.ts` (32/37): `key_provider`, `downcase?`,
  `previous_schemes`, `with_context`, `fixed?`.
- `encryption/configurable.ts` (4/6): `encrypted_attribute_declaration_listeners`/`=`.
- `encryption/properties.ts` (4/6): `each`, `key?`.

`config`/`*_listeners`/`default_context` are module config accessors;
`key_provider`/`previous_schemes`/`fixed?`/`downcase?` are real
EncryptedAttributeType readers; `with_context` swaps the encryption context for a
block; `properties.ts` `each`/`key?` are Hash-like iteration over encryption
properties. Source under
`vendor/rails/activerecord/lib/active_record/encryption/`.

## Acceptance criteria

- Config accessors (`config`, `*_listeners`, `default_context`) ported or
  skip-listed with reason; the EncryptedAttributeType readers
  (`key_provider`, `previous_schemes`, `fixed?`, `downcase?`) and `with_context`
  ported; `properties.ts` `each`/`key?` ported.
- A test for `with_context` and at least one EncryptedAttributeType reader
  matching the Rails test name.
- `pnpm api:compare --package activerecord` shows encryption.ts,
  encryption/encrypted-attribute-type.ts, encryption/configurable.ts,
  encryption/properties.ts at 100%.
