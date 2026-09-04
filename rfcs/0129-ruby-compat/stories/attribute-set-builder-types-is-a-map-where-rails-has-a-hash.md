---
title: "Port AttributeSet::Builder's types/additional_types to a Hash, the last Map in builder.ts"
status: ready
updated: 2026-09-04
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 16
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7418 ported `AttributeSet`'s `@attributes` and `Builder`'s
`default_attributes` to `Record<string, Attribute>`, the shape a Ruby
String-keyed Hash has in this repo. `Builder`'s **other** constructor argument
did not move: `types` is still `Map<string, Type>` in
`packages/activemodel/src/attribute-set/builder.ts` (`Builder`,
`LazyAttributeSet` and `LazyAttributeHash` all carry it), where Rails'
`AttributeSet::Builder#initialize(types, default_attributes = {})`
(`vendor/rails/activemodel/lib/active_model/attribute_set/builder.rb:8-11`)
takes a Hash — specifically the `attribute_types` Hash with a default seat that
`ActiveRecord::ModelSchema#attributes_builder`
(`vendor/rails/activerecord/lib/active_record/model_schema.rb:483-489`) hands it.

The cost is the same one the `@attributes` story named: `this.types.has(name)` /
`this.types.get(name)` / `this.types.keys()` spell Map methods where Rails
spells Hash ones, and `model-schema.ts:419-421` builds a ruby-compat `Hash` and
then a Map-shaped `Builder` next to it.

`additionalTypes` is the same argument in miniature (`builder.rb:17`,
`additional_types = {}`).

## Converged shape

`types` and `additionalTypes` are the ruby-compat `Hash<string, Type>` where the
default seat matters (`attributes_builder`'s argument) and a plain
`Record<string, Type>` where it does not, matching what Rails passes at each
call site; `has`/`get`/`keys` become `hasKey`/index reads/`Object.keys`.

## Acceptance criteria

- No `Map<string, Type>` remains in `attribute-set/builder.ts`.
- `model-schema.ts`'s `attributesBuilder` passes what `attributes_builder`
  passes, with the default seat preserved.
- activemodel and all three AR lanes green; `pnpm parity:api:calls` non-negative.
