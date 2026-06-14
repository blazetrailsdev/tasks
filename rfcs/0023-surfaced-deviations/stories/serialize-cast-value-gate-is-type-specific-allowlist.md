---
title: "updateColumns/insertAll serialize gates are type-specific allowlists, not general"
status: draft
updated: 2026-06-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
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
