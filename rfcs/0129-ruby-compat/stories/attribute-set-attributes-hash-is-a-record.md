---
title: "Port AttributeSet's @attributes to a Record, the last Map where Rails has a Hash"
status: draft
updated: 2026-09-02
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`port-lazy-attribute-hash-delegate-to-a-record` (PR #7383) ported
`LazyAttributeHash`'s `@delegate_hash` to a `Record<string, Attribute>`, so
`deep_dup` is now Ruby's `delegate_hash.transform_values(&:dup)`
(`activemodel/lib/active_model/attribute_set/builder.rb:114-118`) and both
baseline rows were deleted.

Its sibling did not move. `LazyAttributeSet` (`builder.rb:21-30`) passes
`attributes = {}` up to `AttributeSet#initialize` (`attribute_set.rb:8-10`), and
in trails that field is `Map<string, Attribute>`
(`packages/activemodel/src/attribute-set.ts`,
`packages/activemodel/src/attribute-set/builder.ts:37`). A Ruby Hash with
String keys is a `Record` throughout this repo; the `Map` here is what is left
of the outlier.

The cost is visible at every AttributeSet call site: `attribute-set.ts:57,62,67`
each wrap a ruby-compat `transformValues` result in `Object.fromEntries`, and
`each_value` / `key?` / `keys` spell Map methods where Rails spells Hash ones.

## Converged shape

`AttributeSet`'s `@attributes` and `LazyAttributeSet`'s `attributes` parameter
are `Record<string, Attribute>`, prototype-less at construction for the same
reason the delegate hash is (a Ruby Hash has no ancestors — see the
`__proto__` / `toString` cases PR #7383 added to `builder.test.ts`). The
`Object.fromEntries` wrappers at `attribute-set.ts:57,62,67` disappear.

## Acceptance criteria

- `AttributeSet#@attributes` is a `Record`; no `Object.fromEntries` wrapper
  remains around a `transformValues` result in `attribute-set.ts`.
- An `Object.prototype` name (`toString`, `constructor`) is an ordinary absent
  attribute, and `__proto__` an ordinary key, as in `builder.test.ts`.
- activemodel and all three AR lanes green — `AttributeSet` is on the AR read
  path.
- `pnpm parity:api:calls` non-negative; any row the change converges is deleted
  by hand, never reseeded.
