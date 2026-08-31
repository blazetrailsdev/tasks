---
title: "Port LazyAttributeHash's delegate hash to a Record so deep_dup can call transformValues"
status: draft
updated: 2026-08-31
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`LazyAttributeHash#deep_dup`
(`activemodel/lib/active_model/attribute_set/builder.rb:114-118`) is:

```ruby
def deep_dup
  dup.tap do |copy|
    copy.instance_variable_set(:@delegate_hash, delegate_hash.transform_values(&:dup))
  end
end
```

`packages/activemodel/src/attribute-set/builder.ts:196` hand-rolls that
`transform_values` as a `for…of` over a `Map`, and cannot call
`transformValues` from `@blazetrails/ruby-compat` because that export takes a
`Record` — `delegate` is typed `Map<string, Attribute>` (builder.ts:174).

PR #7313 baselined the row rather than converging it, in
`scripts/api-compare/call-mismatches-exclude/activemodel/attribute-set/builder.json`
(`kind: "rubyCompat"`, `deep_dup` / `transform_values`). That row is debt: the
blocker is the delegate hash's TS shape, not the Ruby.

A Ruby `Hash` with String keys ports as a `Record` throughout the repo; the
`Map` here is the outlier. `LazyAttributeSet`'s sibling `@attributes` is also a
`Map`, so the two move together or the story scopes to one.

## Converged shape

Port `delegate_hash` (and, if it falls out cheaply, `LazyAttributeSet`'s
`@attributes`) to a `Record<string, Attribute>`, then `deep_dup` is
`transformValues(this.delegate, (attr) => attr.dup())` and the baseline row is
deleted by hand — never reseeded.

## Acceptance criteria

- `deep_dup` calls `transformValues`; the `kind: "rubyCompat"` `deep_dup` row is
  deleted from `call-mismatches-exclude/activemodel/attribute-set/builder.json`.
- `pnpm parity:api:calls:ruby-compat` and `pnpm parity:api:calls` green (the
  latter may need a `--tighten` after the deletion; no reseed).
- activemodel and all three AR lanes green — `AttributeSet` is on the AR read
  path.
