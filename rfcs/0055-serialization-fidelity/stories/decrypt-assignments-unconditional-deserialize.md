---
title: "Converge decrypt-attribute assignments to Rails' unconditional type.deserialize"
status: done
updated: 2026-07-23
rfc: "0055-serialization-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5112
claim: "2026-07-23T01:33:09Z"
assignee: "decrypt-assignments-unconditional-deserialize"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #5097 review (finding 2b). Rails' `build_decrypt_attribute_assignments`
(vendor/rails/activerecord/lib/active_record/encryption/encryptable_record.rb:214-220)
calls `type.deserialize(ciphertext_for(name))` UNCONDITIONALLY — for an
unencrypted value `ciphertext_for` returns `read_attribute_for_database` and
`deserialize` (with support_unencrypted_data) passes it through cast. trails
instead branches on `encryptedType?.isEncrypted(raw)` and returns
`record.readAttribute(name)` for plaintext
(`packages/activerecord/src/encryption/encryptable-record.ts` buildDecryptAttributeAssignments;
`packages/activerecord/src/encryption.ts` decryptRecord). Likely equivalent —
readAttribute resolves through the same full decorated type — but the shape
deviates and hides the support_unencrypted_data contract in the type itself.

## Acceptance criteria

- buildDecryptAttributeAssignments / decryptRecord call the full resolved
  type's `deserialize(ciphertextFor(...))` unconditionally, mirroring Rails.
- Plaintext rows (supportUnencryptedData) and Serialized(Encrypted(...))
  attributes round-trip unchanged; existing decrypt tests pass.
