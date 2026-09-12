---
title: "updateColumns/insertAll serialize gates are type-specific allowlists, not general"
status: done
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#3397
claim: "2026-06-15T19:00:27Z"
assignee: "serialize-cast-value-gate-is-type-specific-allowlist"
blocked-by: null
---

## Context

Surfaced while converging `defineEnum` onto label storage (PR #3269). Once the
enum attribute stored the label string in memory (instead of the raw integer),
two persistence paths wrote the **in-memory cast value** to the database
instead of the **serialized DB value**, corrupting enum columns:

1. `updateColumns` (`persistence.ts`) computes `cast = type.cast(value)` and
   then deliberately skips `serialize()` for everything except Temporal types,
   on the assumption that "all other cast values are already DB-ready." For
   enums that assumption is false — `cast(0)` → `"draft"` would have been
   written to an integer column. PR #3269 patched this with an explicit
   `EnumType` gate before the Temporal branch.
2. `insertAll` / `upsertAll` prefer `type.serializeCastValue(cast)` over
   `type.serialize(cast)`. `ValueType`'s default `serializeCastValue` is the
   **identity** function, so any type that doesn't override it writes the
   in-memory cast value. PR #3269 patched this by adding
   `EnumType.serializeCastValue` → `serialize`.

Both fixes are **type-specific allowlist patches**. The underlying assumption —
"the cast (in-memory) value equals the DB value for every non-Temporal type" —
is a latent fidelity gap: any current or future `ValueType` subclass whose
in-memory representation differs from its serialized form (and which doesn't
override `serializeCastValue`, or whose type-name isn't in the `updateColumns`
allowlist) will silently persist the wrong value via these two bulk/column
paths.

## Acceptance criteria

- Audit all `ValueType` subclasses (activemodel + activerecord) for cases where
  `cast(value)` differs from `serialize(value)` and `serializeCastValue` is not
  overridden — i.e. types at risk of writing the in-memory value through
  `insertAll`/`upsertAll` or `updateColumns`.
- Either generalize the `updateColumns` serialize gate so it no longer relies on
  a Temporal+Enum type-name allowlist, or document why each excluded type is
  genuinely DB-ready post-cast.
- Add regression coverage for at least one non-Temporal, non-Enum mapped type
  round-tripping through `updateColumns` and `insertAll`/`upsertAll`.

## The Rails anchor for the identity default (added from trails#7729)

The root cause above — "`ValueType`'s default `serializeCastValue` is the identity function" —
has a precise Rails counterpart, which trails#7729 established while resolving
`EncryptedAttributeType#serializeCastValue`:

**Rails' `ActiveModel::Type::Value` defines no `serialize_cast_value` at all.** The method only
exists on classes that opt in: `ActiveModel::Type::SerializeCastValue`
(`vendor/rails/activemodel/lib/active_model/type/serialize_cast_value.rb`) adds
`DefaultImplementation` on include, and only `unless klass.method_defined?(:serialize_cast_value)`
(`:22`). For a type that never included the module, `SerializeCastValue.serialize` (`:29-33`)
takes the fallback arm and calls `type.serialize(value)`, because
`itself_if_serialize_cast_value_compatible` (`:37-39`) returns nil.

trails instead defines it unconditionally on the base
(`packages/activemodel/src/type/value.ts`, `serializeCastValue(value) { return value; }`), which
is what turns a missing opt-in into a silent identity rather than a fallback to `serialize`.

So the converged shape is narrower than "audit every type": **`ValueType` should stop defining
`serializeCastValue`**, matching `Type::Value`, so the dispatcher falls through to `serialize`
for every type that did not opt in. The type-specific allowlist patches (`EnumType`, the
Temporal branch in `updateColumns`) then come out with it.

One dependent to fix in the same change: `ActiveRecord::Encryption::EncryptedAttributeType`
overrides `serializeCastValue` → `serialize` purely to defeat the identity
(`packages/activerecord/src/encryption/encrypted-attribute-type.ts`). Rails does NOT include
`SerializeCastValue` there (`encrypted_attribute_type.rb:10-11`), so once the base stops
defining it the override is deleted, not rewritten — and its
`@noRailsEquivalent CONVERGEABLE converge-encryption-moved-residue` receipt comes out too.
Deleting the override BEFORE the base changes would serialize plaintext instead of ciphertext.
