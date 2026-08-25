---
title: "port-encryptable-record-encrypted-attributes-predicate"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6103
claim: "2026-08-04T23:23:03Z"
assignee: "credit-mixin-methods-ported-in-their-own-file"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Encryption::EncryptableRecord` declares
`class_attribute :encrypted_attributes` (activerecord/lib/active_record/encryption/encryptable_record.rb:11),
which generates the reader, the writer and the `encrypted_attributes?`
predicate on `ActiveRecord::Base`. trails' `encryption/encryptable-record.ts`
carries the reader (`encryptedAttributes`) but no predicate, so
`encrypted_attributes?` / `isEncryptedAttributes` is the one genuinely unported
data-layer method left by the triage in
`docs/infrastructure/mixin-attribution-triage.md` (2026-08-04).

## Acceptance criteria

- The `class_attribute`-generated predicate is carried at the Rails name.
- Test coverage that fails on today's baseline.
