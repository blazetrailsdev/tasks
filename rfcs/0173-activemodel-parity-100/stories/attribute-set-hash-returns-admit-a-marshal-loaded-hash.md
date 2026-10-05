---
title: "activemodel: AttributeSet's Attributes type and cast_types / values_* returns declare Record where a Marshal-loaded set holds a Hash"
status: done
updated: 2026-10-05
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8546
claim: "2026-10-05T18:06:59Z"
assignee: "attribute-set-hash-returns-admit-a-marshal-loaded-hash"
blocked-by: null
closed-reason: null
---

## Context

Split from `lazy-attribute-hash-ivar-types-admit-a-marshal-loaded-hash`, which widened every
hash-typed member of `packages/activemodel/src/attribute-set/builder.ts` to
`Record<string, T> | Hash<string, T>` and stopped at the `AttributeSet` boundary.

ruby-compat's `Marshal.load` answers a Ruby Hash as a `Hash` (a `Map`,
`packages/ruby-compat/src/hash.ts`), so a Marshal-loaded `AttributeSet` holds a `Hash` in
`@attributes` (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set.rb:12-14`), and so
does a loaded `LazyAttributeSet`. `packages/activemodel/src/attribute-set.ts` still declares
`type Attributes = Record<string, Attribute> | LazyAttributeHash`, and three readers return a
plain `Record` where `transform_values` over a loaded set answers a `Hash`
(`rb_hash_transform_values`, `vendor/ruby/v3.3.11/hash.c:3366`):

- `castTypes()` (`attribute_set.rb:20-22`), `valuesBeforeTypeCast()` (`:24-26`),
  `valuesForDatabase()` (`:28-30`).
- `LazyAttributeSet`'s `_attributes` field, its constructor's `attributes` parameter and its
  `attributes()` override (`attribute-set/builder.ts`) are held at `Record` by the base type.
- `LazyAttributeHash#transformValues` already returns the union; `AttributeSet` reaches it through
  ruby-compat's own-method overload of `transformValues`, which declares `Record<string, U>`.

Widening those returns reaches their consumers, which index the result as a plain object:

- `attributeTypes()` (`packages/activemodel/src/attribute-registration.ts`, Rails
  `attribute_registration.rb:37-41`) wraps `castTypes()` in a `Proxy` to stand in for
  `hash.default = Type.default_value`, and about 27 call sites read `attributeTypes()[name]`.
- `attributesBeforeTypeCast` / `attributesForDatabase`
  (`packages/activerecord/src/attribute-methods/before-type-cast.ts`) declare
  `valuesBeforeTypeCast(): Record<string, unknown>` on their host.
- Tests that index the result: `attribute-set.trails.test.ts`, `attributes.trails.test.ts`,
  `attribute-set/yaml-encoder.trails.test.ts`.

ruby-compat's `fetch`, `eachKey`, `transformValues` and `dup` gained an either-arm overload in
that PR. `eachValue` and activesupport's `reverseMergeBang` have none that admits
`Record | Hash | LazyAttributeHash`.

## Acceptance criteria

- [ ] `Attributes` in `attribute-set.ts` is
      `Record<string, Attribute> | Hash<string, Attribute> | LazyAttributeHash`, and
      `LazyAttributeSet`'s `_attributes`, constructor parameter and `attributes()` follow it.
- [ ] `castTypes`, `valuesBeforeTypeCast` and `valuesForDatabase` declare the union their
      `transformValues` call answers, with no cast added to satisfy a consumer.
- [ ] `attributeTypes` keeps Rails' `hash.default = Type.default_value` for both arms, and no
      bare `hash[key]` / `Object.keys(hash)` read of one of these values remains in activemodel or
      activerecord `src/`, tests included.
- [ ] `pnpm typecheck` and `pnpm test:types` stay green.
