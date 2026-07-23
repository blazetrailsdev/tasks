---
title: "Deterministic query expansion serializes through bare Encrypted type, skipping outer Serialized coder"
status: done
updated: 2026-07-23
rfc: "0055-serialization-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 5135
claim: "2026-07-23T12:18:05Z"
assignee: "deterministic-query-expansion-full-type-serialize"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while closing encryption-eager-attribute-definitions-view-diverges (#5097).
The extended-deterministic sites now resolve
`encryptedTypeOf(getAttributeType(...))` and serialize/expand through the
UNWRAPPED EncryptedAttributeType
(`packages/activerecord/src/encryption/extended-deterministic-queries.ts` processArguments/scopeForCreate;
`packages/activerecord/src/encryption/extended-deterministic-uniqueness-validator.ts` allCiphertextsFor,
previousTypes serialize). Rails resolves `type = owner.type_for_attribute(name)`
(vendor/rails/activerecord/lib/active_record/encryption/extended_deterministic_queries.rb:58-62)
and serializes through the FULL delegated type — for a deterministic
Serialized(Encrypted(...)) attribute (encrypts-then-serialize) the coder dumps
BEFORE encryption, so trails' bare-Encrypted serialize produces different
ciphertext for query expansion than the write path. Behavior-preserving vs the
retired eager view, but a fidelity gap for deterministic + post-encrypts
serialize combos.

## Acceptance criteria

- Deterministic query expansion and uniqueness ciphertext generation serialize
  candidate values through the full resolved type (coder applied before
  encryption), matching the write path and Rails' delegation.
- A trails guard covers a deterministic Serialized(Encrypted(...)) attribute
  queried by plaintext value (Rails has no direct test).
