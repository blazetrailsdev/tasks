---
title: "type_for_column is one TS method where Rails has an override and a super, and the super seat is a dead stub with the invented guard"
status: draft
updated: 2026-09-07
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
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

Rails has TWO `type_for_column` methods, one overriding the other:

- `ActiveRecord::ModelSchema#type_for_column`
  (`vendor/rails/activerecord/lib/active_record/model_schema.rb:622-628`) — the
  super: calls `connection.lookup_cast_type_from_column(column)` and applies
  `to_immutable_string` when `immutable_strings_by_default`.
- `ActiveRecord::Attributes#type_for_column`
  (`vendor/rails/activerecord/lib/active_record/attributes.rb:301-303`) — the
  override, whose whole body is `hook_attribute_type(column.name, super)`.

trails collapses both into one method and leaves the other as a dead stub:

- `packages/activerecord/src/attributes.ts#typeForColumn` inlines the
  `model_schema.rb` super body (the `lookupCastTypeFromColumn` call and the
  `immutableStringsByDefault` / `toImmutableString` arm) and then applies
  `hookAttributeType` — one TS method where Rails has two, with no `super`.
- `packages/activerecord/src/model-schema.ts:889` — the seat that SHOULD hold
  the `model_schema.rb:622-628` body — is unreferenced dead code that still
  carries the invented `typeof connection?.lookupCastTypeFromColumn ===
"function"` guard and `return null`, and never had the `to_immutable_string`
  arm at all. It is the last copy of the guard PR #7596 removed from
  `attributes.ts`.

Surfaced while converging `attributes.ts#typeForColumn` in PR #7596
(`type-for-column-invents-a-guard-and-a-default-fallback`), which was scoped to
the invented guard and fallback in the `attributes.ts` copy only.

## Converged shape

`model-schema.ts#typeForColumn` holds the `model_schema.rb:622-628` body —
unconditional `lookupCastTypeFromColumn`, then the `immutableStringsByDefault` /
`toImmutableString` arm — with the invented `typeof` guard and the `return null`
gone. `attributes.ts#typeForColumn` shrinks to `attributes.rb:302`'s one line:
`hookAttributeType(column.name, super)`, reaching the ModelSchema body through
whatever super/mixin seam the two hosts already share, so one Rails method is
one TS method on each side.

## Acceptance criteria

- [ ] `model-schema.ts#typeForColumn` mirrors `model_schema.rb:622-628`: no
      `typeof` guard, no `return null`, and the `to_immutable_string` arm present.
- [ ] `attributes.ts#typeForColumn` is `hookAttributeType(column.name, super)`
      and nothing else, per `attributes.rb:301-303`.
- [ ] Neither copy is dead code; the `_defaultAttributes` seed reaches the
      ModelSchema body through the override.
- [ ] `parity:api:calls` / `:args` deltas non-negative; no new baseline row.
