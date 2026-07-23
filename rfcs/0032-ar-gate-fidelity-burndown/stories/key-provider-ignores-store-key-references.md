---
title: "key-provider-ignores-store-key-references"
status: claimed
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-23T13:22:36Z"
assignee: "key-provider-ignores-store-key-references"
blocked-by: null
closed-reason: null
---

## Context

Found by per-entry wide-call verification. Rails
`KeyProvider#encryption_key`
(vendor/rails/activerecord/lib/active_record/encryption/key_provider.rb:20-26)
memoizes `@keys.last` and, when
`ActiveRecord::Encryption.config.store_key_references` is set, tags the key:
`key.public_tags.encrypted_data_key_id = key.id`. Trails
(packages/activerecord/src/encryption/key-provider.ts:19-21) returns
`_keys[_keys.length - 1]` and ignores the config flag, even though
`storeKeyReferences` exists at
packages/activerecord/src/encryption/config.ts:14. Encrypted payloads never
carry key references, so multi-key rotation lookup by reference cannot work.

## Acceptance criteria

- encryptionKey applies the store_key_references tag as Rails does.
- Rails' key-provider/key-rotation tests covering store_key_references pass.
