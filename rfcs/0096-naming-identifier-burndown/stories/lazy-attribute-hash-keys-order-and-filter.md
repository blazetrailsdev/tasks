---
title: "lazy-attribute-hash-keys-order-and-filter"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6538
claim: "2026-08-14T18:57:42Z"
assignee: "activemodel-define-attribute-method-code-generator"
blocked-by: null
closed-reason: null
---

## Context

`packages/activemodel/src/attribute-set/builder.ts#keys` returns

```ts
new Set([...this.delegate.keys(), ...Object.keys(this.values), ...this.types.keys()]);
```

Rails' `LazyAttributeHash#keys`
(`vendor/rails/activemodel/lib/active_model/attribute_set/builder.rb:36-39`) is

```ruby
def keys
  keys = values.keys | types.keys | @attributes.keys
  keys.keep_if { |name| self[name].initialized? }
end
```

Two divergences, both behavioural rather than naming:

1. **Order.** Rails unions `values`, then `types`, then `@attributes`; trails
   puts the materialized `@attributes` (`delegate`) FIRST. `keys` feeds
   attribute-name ordering downstream, so the two orders are observably
   different once an attribute has been materialized out of order.
2. **The `keep_if` filter is missing entirely.** Rails drops any key whose
   attribute is not `initialized?`; trails returns every key it saw. The same
   filter is absent from `eachKey` (builder.ts:209-216), which shares the shape.

Surfaced by RFC 0096 wave 3 (`naming-burndown-3-arel-activemodel`), where it
keeps one `naming` call-argument row standing on `builder.ts#keys`. The row is
a1/a3 residue and must not be renamed away.

## Acceptance criteria

- [ ] `keys` unions in Rails' order (`values`, `types`, `attributes`) and
      applies the `initialized?` filter, per builder.rb:36-39.
- [ ] `eachKey` is reconciled with whatever `keys` ends up doing, or its
      divergence is justified at the call site against the Rails line it mirrors.
- [ ] A test covers a non-`initialized?` attribute being excluded from `keys`,
      and fails on the baseline.
- [ ] `pnpm parity:api:calls:args:report` shows the `builder.ts` `naming` row
      retired or reclassified, with no new `shape` row.
