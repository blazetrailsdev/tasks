---
title: "where-hash-arm-resolves-array-key-aliases"
status: draft
updated: 2026-09-02
rfc: "0129-ruby-compat"
cluster: null
packages: []
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

`build_where_clause`'s `when Hash` arm
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1631-1638`)
runs `transform_keys` with TWO branches:

```ruby
opts = opts.transform_keys do |key|
  if key.is_a?(Array)
    key.map { |k| model.attribute_aliases[k.to_s] || k.to_s }
  else
    key = key.to_s
    model.attribute_aliases[key] || key
  end
end
```

trails' port (`packages/activerecord/src/relation/query-methods.ts`,
`buildWhereClause`) carries only the `else` arm: it does
`String(rawKey)` and one alias lookup, so an ARRAY key — the composite-key
spelling `where([:shop_id, :id] => [[1, 2], [3, 4]])` uses — never has its
members resolved through `attribute_aliases`, and the key is flattened by
`String()` into `"shop_id,id"`.

Surfaced by review of PR #7403, which converged the same arm to accept the
`Map` spelling of a Ruby Hash. That PR did not touch the key walk's branch
structure, so this is a pre-existing gap, not a regression.

## Acceptance criteria

- [ ] The Hash arm's key walk has both branches Rails has, in Rails' order:
      an Array key maps each member through `attributeAliases` (with `to_s`
      on each member), a scalar key keeps the existing single lookup.
- [ ] Both branches run for every spelling of a Hash the arm accepts — the
      plain object and the `Map`, per PR #7403.
- [ ] Pinned by a test using the canonical composite-PK models, aliasing at
      least one member of the composite key so the alias resolution is what
      the assertion turns on.
- [ ] `pnpm parity:api:calls` and `:args` unchanged or improved.
