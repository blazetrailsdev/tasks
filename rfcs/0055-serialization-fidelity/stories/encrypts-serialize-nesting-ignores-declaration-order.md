---
title: "encrypts + serialize nesting order ignores declaration order for the encrypts-first case"
status: draft
updated: 2026-07-21
rfc: "0055-serialization-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while closing `serialize-encrypts-decorator-ordering` (#5033).

PR #5033 fixed the seed so pending decorators are each applied exactly once. But
the resulting _nesting order_ still does not track declaration order for the
`encrypts`-then-`serialize` case.

Rails' `encrypts` and `serialize` both register via `decorate_attributes`
(`vendor/rails/activerecord/lib/active_record/encryption/encryptable_record.rb:87-92`
and `attribute_methods/serialization.rb`), and
`ActiveModel::AttributeRegistration` replays pending decorators in declaration
order (`activemodel/lib/active_model/attribute_registration.rb:66-72`). So for
the two canonical fixtures in
`vendor/rails/activerecord/test/models/book_encrypted.rb:78-90`:

| model                                     | declaration order           | Rails resolves to               |
| ----------------------------------------- | --------------------------- | ------------------------------- |
| `EncryptedBookWithSerializedFirstBinary`  | `serialize` then `encrypts` | `Encrypted(Serialized(Binary))` |
| `EncryptedBookWithSerializedSecondBinary` | `encrypts` then `serialize` | `Serialized(Encrypted(Binary))` |

trails currently resolves **both** to `Encrypted(Serialized(Binary))`.

Cause: `registerEncryptedType`
(`packages/activerecord/src/encryption/encryptable-record.ts:300-330`) is
re-invoked from `applyPendingEncryptions` on every `_defaultAttributes` rebuild
and pushes a _fresh_ PendingDecorator onto the tail of the queue when its
`def.type instanceof EncryptedAttributeType` early-return does not fire — so the
encryption decorator can end up replaying after `serialize`'s regardless of the
order the two were declared in.

Functionally both nestings round-trip (Rails' `serialized binary data can be
encrypted` passes either way, which is why #5033 shipped with this open):
`Serialized#serialize` calls `coder.dump` then `subtype.serialize`, so both
orders encrypt the JSON. This is a fidelity gap, not a correctness bug.

Guard test already in place:
`packages/activerecord/src/encryption/encryptable-record.trails.test.ts` asserts
the resolved chain for both orders — it will need its `SecondBinary` expectation
updated to `Serialized(Encrypted(Binary))` as part of this story.

## Acceptance criteria

- `EncryptedBookWithSerializedSecondBinary` resolves to
  `Serialized(EncryptedAttributeType(<binary column type>))`, matching
  declaration-order replay; `...FirstBinary` stays
  `EncryptedAttributeType(Serialized(<binary column type>))`.
- The encryption decorator is not re-pushed to the queue tail on rebuild in a way
  that reorders it relative to decorators declared after it.
- No unbounded PendingDecorator growth across repeated `_defaultAttributes`
  rebuilds / schema reloads (the invariant the current early-return protects).
- `encryptable-record.trails.test.ts` updated to assert the two DIFFERENT chains.
- `serialized binary data can be encrypted` still passes.
- Passes on sqlite + CI PG/MySQL(MariaDB).
