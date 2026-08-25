---
title: "enum-subtype-derived-from-column-type"
status: closed
updated: 2026-07-07
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 51
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicate of enum-subtype-from-reflected-column-type: both stories mandate resolving EnumType's subtype from the reflected column attribute type (Rails enum.rb decorate_attributes) instead of inferSubtype(mapping-shape); the surviving story additionally covers collapsing the duplicate enumTypeFor resolution path, subsuming this one."
---

## Context

Surfaced while porting `enum-min-max-deserialize-in-aggregates` (PR #4414). That fix
unwraps an `EnumType` to its subtype for aggregate casting via
`EnumType#subtypeType()` → `_subtypeType`, which relies on how trails builds the
enum's subtype. That derivation is a fidelity approximation.

Rails resolves an enum column's subtype from the column's **actual attribute
`Type::Value`** — `EnumType.new(name, mapping, subtype)` is passed the real
resolved column type (with schema-derived `limit`/`precision`/`scale`). See
`activerecord/lib/active_record/enum.rb` (`_enum` layering on
`type_for_attribute(name)`), Rails 8.0.2.

trails instead (in `packages/activerecord/src/enum.ts`):

- `inferSubtype(values)` — guesses the subtype **name** from the mapping's value
  shapes: all-numbers → `"integer"`, all-booleans → `"boolean"`, else
  `"string"`; empty/all-null → `"integer"`.
- `subtypeInstance(name)` — `typeRegistry.lookup(name)`, a **default-option**
  instance (no schema limit/precision/scale), falling back to `new IntegerType()`.

The `inferSubtype` doc comment already flags this: _"trails falls back to the
mapping shape when the schema-derived attribute definition isn't available yet."_

## Why it matters

Behaviorally identical for the common integer/string/boolean enums (deserialize
doesn't depend on limit/precision), which is why the min/max aggregate fix is
correct. But it diverges from Rails when:

- an enum is declared with an empty/all-null mapping on a **string** column →
  trails mis-types it as `"integer"`;
- the backing column is decimal/float-backed, or an integer with a non-default
  `limit` → trails uses a default-option subtype rather than the schema's real
  type.

## Acceptance criteria

- `EnumType`'s subtype is derived from the column's resolved attribute type
  (schema-sourced) when available, matching Rails' `type_for_attribute` subtype,
  rather than inferred from mapping value shapes.
- `inferSubtype`/`subtypeInstance` remain only as the pre-schema fallback (when
  no attribute definition exists yet), not the primary path.
- A test covering: (a) a string-backed enum with an empty/all-null-value mapping
  resolves subtype `string`, not `integer`; (b) a non-default-option backing
  column's subtype carries its schema options.
- No behavior change for the existing integer/string/boolean canonical enums
  (Book difficulty/status, etc.).

## Notes

Pre-existing gap from the enum-fidelity subtype refactor on main; not introduced
by PR #4414, only relied upon by it. Low behavioral risk, fidelity-tracked.
