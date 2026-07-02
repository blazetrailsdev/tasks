---
title: "converge-enum-attribute-to-decorate-attributes"
status: draft
updated: 2026-07-02
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #4413 (enum-install-attribute-suppresses-db-default) fixed enum new-record
defaults with a `defaultFromSchema` flag threaded through `enum.ts`,
`attributes.ts` (`_defaultAttributes` seed branch), and `model-schema.ts`
(`applyColumnsHash` re-injection). This is a trails-specific bookkeeping bridge,
not Rails' actual mechanism.

Rails' `_enum` (activerecord/lib/active_record/enum.rb:238-247) does NOT call
`attribute(name, enum_type)`. It calls `attribute(name, **options)` (bare) then
`decorate_attributes([name]) { |_n, subtype| EnumType.new(...) }`. This works
because Rails' `_default_attributes` re-seeds from
`columns_hash.transform_values { Attribute.from_database(...) }`
(activerecord/lib/active_record/attributes.rb:241-253) on every rebuild, then
replays pending modifications; `FromDatabase#with_type` stays a FromDatabase
(deserialize) instance, so the enum default flows through deserialize with zero
special-casing.

trails diverges: `_defaultAttributes` (packages/activerecord/src/attributes.ts
~line 183) seeds from the cached `_attributeDefinitions` map, seeds user-sourced
defs via `withUserDefault` (cast), and schema reflection SKIPS user-declared defs
(packages/activerecord/src/model-schema.ts ~line 927). trails' `decorateAttributes`
(packages/activemodel/src/attribute-registration.ts:133) also no-ops on a column
whose def doesn't exist yet (enum declared before first query). Empirically, a
bare-`attribute` + `decorateAttributes` port of `installEnumAttribute` regresses
4 enum tests (type.serialize, find via where with symbols/strings, build from
where) because the EnumType never lands in `_attributeDefinitions`.

## Acceptance criteria

- Restructure AR `_defaultAttributes` to seed schema columns via
  `Attribute.fromDatabase` first, then replay pending PendingType/PendingDefault/
  PendingDecorator modifications on top (Rails column-seed-then-replay), so
  user type-overrides on schema columns keep the FromDatabase (deserialize)
  attribute.
- Convert `installEnumAttribute` to Rails' `attribute(name)` (bare) +
  `decorateAttributes([name], (_n, subtype) => enumType)` form and delete the
  `defaultFromSchema` flag, its `_defaultAttributes` seed branch, and the
  `applyColumnsHash` re-injection branch.
- All existing enum tests (enum.test.ts) and relation-scoping.test.ts default
  assertions continue to pass on all three adapters.
