---
title: "instantiate: materialize override types for absent keys lacking a schema default"
status: in-progress
updated: 2026-07-08
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 23
pr: 4798
claim: "2026-07-08T19:52:34Z"
assignee: "instantiate-override-types-materialize-absent-nodefault-keys"
blocked-by: null
closed-reason: null
---

## Context

PR #4760 ported `base.test.ts` "column types typecast" to the Rails
`instantiate(attributes, types)` shape and added `AttributeSet#overrideFromDatabase`,
threaded as `overrideTypes` from the public `Base.instantiate` entry point
(`packages/activerecord/src/base.ts` `_instantiate`, `inheritance.ts`
`directInstantiate`). Overrides are applied only while iterating keys **present**
in the attributes hash.

Rails' `LazyAttributeHash` (vendor/rails/activemodel/lib/active_model/attribute_set/builder.rb:63-86,
152-178) materializes every `types.each_key` AND `additional_types` key. For a key
absent from the values hash it resolves `type = additional_types.fetch(name, types[name])`,
then: if `default_attributes[name]` exists → `attr.dup` (schema type, override NOT
applied); else → `Attribute.uninitialized(name, type)` — i.e. the override type IS
applied when the key has no schema default (a purely additional/computed override key).

trails currently drops that last case: an override supplied for a key that is
neither in the attributes hash nor in the model's schema defaults is never
materialized. For real schema columns trails already matches Rails (schema type
kept), so this is a narrow edge: `instantiate({}, { computed_col: customType })`.

## Acceptance criteria

- [ ] `Base.instantiate(attrs, types)` materializes an override type for a key
      that is absent from `attrs` and has no schema default, as
      `Attribute.uninitialized(name, overrideType)` — mirroring
      builder.rb's `elsif types.key?(name) ... else Attribute.uninitialized`.
- [ ] Schema columns omitted from `attrs` keep their schema type (unchanged;
      Rails `attr.dup` branch).
- [ ] Add a trails-sibling test covering the no-default override key.
