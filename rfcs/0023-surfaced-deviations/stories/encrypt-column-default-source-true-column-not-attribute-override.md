---
title: "Encrypted attr default should read true DB column default, not attribute() override"
status: ready
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while implementing encrypt-thread-column-default-into-encrypted-type
(PR #4435). `EncryptableRecord.columnDefaultFor` reads the encrypted
attribute's default from the reflected attribute definition's `defaultValue`
(`packages/activerecord/src/encryption/encryptable-record.ts`), NOT from the
true DB column default.

Rails uses the column default specifically:
`EncryptedAttributeType.new(..., default: columns_hash[name.to_s]&.default)`
(vendor/rails/activerecord/lib/active_record/encryption/encryptable_record.rb:91).

Deviation: if a model declares `attribute(name, { default: X })` where X
differs from the DB column default Y, trails threads X into the encrypted type
while Rails threads Y. This is currently INERT — every encrypted model in the
suite sets its `attribute()` default equal to the `encrypted_books.name`
column default (`<untitled>`), and reflection-only models get the real column
default via `def.defaultValue`. So no test exercises the divergence.

Why not fixed in #4435: reading the true column default requires
`columnsHash()`, which warms the shared schema cache and DETERMINISTICALLY
broke a sibling test (contexts.test.ts) via cross-file perturbation — see
[[project_schema_cache_warming_converges_partial_decl]] and the
`columnshash-sync-schema-cache-reload-vs-sibling-borrow` story. `def.defaultValue`
was the pragmatic, footgun-free choice.

## Acceptance criteria

- [ ] `columnDefaultFor` threads the true DB column default
      (`columns_hash[name].default`) into `EncryptedAttributeType`, not the
      possibly-overridden `attribute()` default, without warming the shared
      schema cache in a way that regresses sibling encryption tests.
- [ ] Regression test: encrypted model declaring an `attribute()` default that
      differs from the DB column default threads the COLUMN default (matches
      Rails).
- [ ] contexts.test.ts + encryptable-record.test.ts co-scheduled stay green.
- [ ] No api:compare / call-mismatch regressions.
