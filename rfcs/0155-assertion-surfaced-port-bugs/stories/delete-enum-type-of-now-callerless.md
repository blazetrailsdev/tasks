---
title: "Delete enumTypeOf; tests read Model.typeForAttribute as Rails does"
status: draft
updated: 2026-09-30
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8277 converged `TypeCaster::Map#type_cast_for_database` onto Rails
(`vendor/rails/v8.0.2/activerecord/lib/active_record/type_caster/map.rb:10-17`:
`type = type_for_attribute(attr_name); type.serialize(value)` through
`klass.type_for_attribute(name)`), dropping its `enumTypeOf` shortcut. That removed
the last production caller of `enumTypeOf` (`packages/activerecord/src/enum.ts:461`),
an exported helper with no Rails counterpart. Its receipt,
`@noRailsEquivalent CONVERGEABLE reads the EnumType off the replayed attribute set the way Ruby reads attribute_types[name] (enum.rb:222-247)`,
is prose where a story id belongs.

Its only callers are `packages/activerecord/src/enum.trails.test.ts` (7 sites, around
lines 307-385), which read the enum type off a model. Rails reads it with
`Model.type_for_attribute(name)` (`attribute_methods.rb` / `model_schema.rb`
`type_for_attribute`), which returns the `EnumType` that `enum.rb:222-247` decorates onto
`attribute_types[name]`.

## Acceptance criteria

- `enumTypeOf` is deleted from `enum.ts`.
- The `enum.trails.test.ts` callers read the type with `Model.typeForAttribute(name)`,
  as Rails does, and keep their assertions.
- `pnpm parity:api:extra:gate` stays green, and `parity:api:extra:tighten` is run if the mark drops.
