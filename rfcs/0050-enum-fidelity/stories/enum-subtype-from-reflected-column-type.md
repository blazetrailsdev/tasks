---
title: "Resolve enum subtype lazily from reflected column type (not mapping shape)"
status: ready
updated: 2026-07-07
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 56
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`enum-boolean-nil-string-value-support` (PR #4409) added boolean/nil/string
enum values by giving `EnumType` a real subtype `ValueType` for
cast/serialize/deserialize. But the subtype is resolved **eagerly at macro
time**, not lazily from the reflected column type as Rails does.

- `_enum` (`packages/activerecord/src/enum.ts`) reads the subtype from
  `_attributeDefinitions.get(name)` at `enum()` call time; when the schema
  isn't reflected yet (the common case in a model static block), it falls back
  to `inferSubtype(Object.values(mapping))` — guessing integer/boolean/string
  from the mapping value shapes.
- `enumTypeFor` (the Map type-caster serialize path) **independently** infers
  the subtype from the mapping shape, a second, separate resolution path.

Rails resolves the subtype lazily in `decorate_attributes`
(`vendor/rails/activerecord/lib/active_record/enum.rb:239-247`): it takes the
column's actual `Type::Value` instance and passes it into `EnumType.new`, so
the enum always delegates to the real underlying column type.

Deviation: if a column's reflected DB type differs from what the mapping shape
implies — e.g. an integer-valued enum on a `bigint`/`decimal` column, or a
string-valued enum on a `text` column — trails' inferred subtype won't match
the real column type, so cast/serialize/deserialize coercion diverges.
`subtypeInstance()` also falls back to `IntegerType` for any registry-unknown
subtype name.

No canonical model currently exercises this (all enum columns are
integer/boolean/string-backed matching their mapping shapes), so it is a latent
gap, not a live failure.

## Acceptance criteria

- Resolve the enum subtype from the reflected attribute/column type (Rails'
  `decorate_attributes` model), not eagerly from the mapping shape, so the
  `EnumType` delegates to the column's real `Type::Value`.
- Collapse the duplicate subtype-resolution path (`_enum` vs `enumTypeFor`) so
  there is a single source of truth.
- Add a test covering an enum whose column type differs from the mapping-shape
  inference (e.g. integer-valued enum on a non-integer-backed column).
