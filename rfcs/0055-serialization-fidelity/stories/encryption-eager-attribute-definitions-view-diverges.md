---
title: "Retire encryption's eager _attributeDefinitions wrap; resolve types via typeForAttribute"
status: in-progress
updated: 2026-07-22
rfc: "0055-serialization-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 40
pr: 5097
claim: "2026-07-22T23:20:42Z"
assignee: "encryption-eager-attribute-definitions-view-diverges"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while closing `encrypts-serialize-nesting-ignores-declaration-order` (#5060).

PR #5060 made the durable encryption PendingDecorator push once at declaration
time, so `typeForAttribute` (via `_defaultAttributes` replay) resolves the
Rails-correct nesting: encrypts-then-serialize →
`Serialized(Encrypted(<column>))`.

But the eager `_attributeDefinitions` back-compat view — maintained by
`registerEncryptedType`'s durable branch
(`packages/activerecord/src/encryption/encryptable-record.ts:335-375`, driven
by `applyPendingEncryptions` on every rebuild) — wraps ONLY the encryption
decorator into `def.type`. For `EncryptedBookWithSerializedSecondBinary` the
eager view holds `Encrypted(binary)` while the resolved type is
`Serialized(Encrypted(binary))`: the views diverge, and Rails has no such
eager view at all (`type_for_attribute` is the only lookup surface,
`attribute_registration.rb:66-72`).

Consumers of the eager view via `getAttributeType`/`def.type`
(`deterministicEncryptedAttributes`, `isEncryptedAttribute`,
`buildDecryptAttributeAssignments` in encryptable-record.ts; encryption.ts:283,
302, 367) therefore see a different type shape than `typeForAttribute` for any
attribute with a post-encrypts decorator. The `_pendingEncryptions` buffer
(`registerPendingEncryption`) now exists ONLY to feed this eager re-wrap +
validator re-runs — retiring the eager wrap would let the buffer shrink to the
validator/frozen-validator bookkeeping.

## Acceptance criteria

- Encryption call sites that inspect an attribute's type resolve through
  `typeForAttribute` (the replayed default set), not `_attributeDefinitions`
  `def.type`, matching Rails' single lookup surface.
- `registerEncryptedType`'s durable branch (the eager wrap + provisional-default
  correction) is removed or reduced to whatever consumers still genuinely need,
  with each remaining need justified at the call site.
- `deterministicEncryptedAttributes` / `isEncryptedAttribute` behave correctly
  for `Serialized(Encrypted(...))` attributes (encrypts-then-serialize) — add a
  trails guard if Rails has no direct test.
- No behavior change for the plain (non-decorateAttributes) mock-model path.
- Existing encryption + serialized-attribute suites pass on sqlite + CI PG/MySQL.
