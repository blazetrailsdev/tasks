---
title: "Seed _default_attributes from reflected type_for_column (drop enumReflectedSubtype stash)"
status: claimed
updated: 2026-07-08
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 24
pr: null
claim: "2026-07-08T20:07:34Z"
assignee: "converge-attribute-seed-to-reflected-type-for-column"
blocked-by: null
closed-reason: null
---

## Context

`enum-subtype-from-reflected-column-type` (PR #4748) revealed that trails'
column-seed-then-replay (`_defaultAttributes`, phase 1 —
`packages/activerecord/src/attributes.ts:196-210`) seeds a user-override
attribute (enum, encryption, serialize, normalizes) on a real DB column with
the **override's own type** (`def.type`), NOT the reflected column type.

Rails instead seeds `_default_attributes` from
`type_for_column(connection, column)`
(`vendor/rails/activerecord/lib/active_record/attributes.rb:241-245`), so the
`decorate_attributes` block receives the reflected column `Type::Value` as its
`subtype`. Because trails deviates here, the enum decorator never saw the real
column type and PR #4748 had to work around it with a per-def
`enumReflectedSubtype` stash computed in `applyColumnsHash`
(`packages/activerecord/src/model-schema.ts`) plus an `enumTypeExplicit` gate.

## Acceptance criteria

- Phase-1 seed for a userProvided-def-on-real-column uses the reflected
  `type_for_column` (the `reflectedTypeForColumn` pipeline already in
  model-schema.ts: adapter cast type → immutable-string conversion →
  `hook_attribute_type`), so the decorator's `subtype` arg is the real column
  type — matching Rails attributes.rb:241-245.
- Remove the `enumReflectedSubtype` stash + `enumTypeExplicit` gate workaround
  from `enum.ts` / `model-schema.ts` once the decorator receives the reflected
  type directly; `enumTypeFrom` then mirrors Rails' block verbatim
  (`subtype = subtype.subtype if EnumType === subtype`).
- Verify no regression for encryption / serialize / normalizes user-overrides
  (they also flow through the same seed path) and for explicitly-typed enums
  (an explicit `attribute(name, type)` must still win over the column, e.g.
  integer enum on MySQL `TINYINT(1)` must not coerce through boolean).
- Keep the schema-reflected + default-only + explicit-type enum tests added in
  PR #4748 green.

Blast radius is broad (all user-override-on-column attributes), hence a
separate story rather than folding into #4748.
