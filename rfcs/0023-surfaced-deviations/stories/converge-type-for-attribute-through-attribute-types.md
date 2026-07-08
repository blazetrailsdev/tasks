---
title: "Resolve type_for_attribute/TypeCaster::Map through attribute_types to retire per-feature replay hooks"
status: claimed
updated: 2026-07-08
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-07-08T23:37:33Z"
assignee: "converge-type-for-attribute-through-attribute-types"
blocked-by: null
closed-reason: null
---

## Context

`TypeCaster::Map._baseTypeForAttribute` (packages/activerecord/src/type-caster/map.ts:45-79)
and `Base.typeForAttribute` (packages/activerecord/src/base.ts:1181-1189) both read the
raw `_attributeDefinitions.get(name).type` store directly. Rails' `type_for_attribute`
resolves through `attribute_types[name]`
(vendor/rails/activemodel/lib/active_model/attribute_registration.rb:43-50), which is
built from the default AttributeSet and therefore carries every pending decoration.

Because `_attributeDefinitions` only receives a decoration when the column is already
reflected at declaration time, any feature that decorates a not-yet-reflected column via
`decorateAttributes` must re-apply its decorator onto `_attributeDefinitions` after schema
reflection. That is why we carry three near-identical post-reflection replay hooks:
`applyPendingNormalizations` (packages/activemodel/src/model.ts:512-533),
`applyPendingEncryptions`, and — added by PR #4731 — `applyPendingSerializations`
(packages/activerecord/src/serialize.ts). Each is wired into the same three reflection
sites (base `attribute()` + both `applyColumnsHash` branches in model-schema.ts).

The Rails-faithful convergence is to route `type_for_attribute` / `TypeCaster::Map`
through the decorated default attribute set (`attribute_types`) so decorations are seen
without any per-feature replay, retiring the three `applyPending*` hooks.

## Risk / why deferred

The `TypeCaster::Map` fast-path deliberately keeps the raw subtype for enum columns
(map.ts:17-35 comment): the cast path must return the raw subtype so `whereValuesHash` /
`scopeForCreate` round-trip the label the accessors expect, while only the serialize path
maps label→int. Naively switching to `attribute_types[name]` would return `enumType` on
the cast path and regress enum where/create semantics. The convergence must preserve the
enum Map/Connection split (or move it) — this is why PR #4731 chose the localized replay
hook instead.

## Acceptance criteria

- `Base.typeForAttribute` and `TypeCaster::Map.typeForAttribute` resolve through the
  decorated default attribute set (matching Rails `attribute_types[name]`), so
  `serialize`/`normalizes`/`encrypts` decorations are honored on the query side without a
  per-feature post-reflection replay.
- Enum where/create round-tripping is preserved (the raw-subtype cast path for enum
  columns must not regress — see map.ts:17-35).
- The now-redundant `applyPendingNormalizations` / `applyPendingEncryptions` /
  `applyPendingSerializations` replay hooks and their call sites are removed (or reduced to
  the minimum still required).
- Existing serialization / normalized-attribute / enum / encryption suites stay green.
