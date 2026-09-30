---
title: "LazyAttributeHash#deep_dup is dup + instance_variable_set(:@delegate_hash); port initialize_dup"
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

`LazyAttributeHash#deep_dup` is `dup.tap { |copy| copy.instance_variable_set(:@delegate_hash, delegate_hash.transform_values(&:dup)) }`,
and `initialize_dup` re-copies `@delegate_hash`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set/builder.rb:118-127`).

trails' `LazyAttributeHash#deepDup` (`packages/activemodel/src/attribute-set/builder.ts:198`)
builds a fresh `new LazyAttributeHash(...)` and copies `materialized` by hand,
and there is no `initializeDup`. trails#8276 added ruby-compat `rbObjIvarSet`
and declared `@delegate_hash` → `_delegateHash` with `rbDeclareIvar`, so the
Rails body is now expressible.

## Converged shape

`deepDup` is `dup()` then `rbObjIvarSet(copy, "@delegate_hash", transformValues(this.delegateHash(), (a) => a.dup()))`,
with `initializeDup` re-copying `_delegateHash` as `builder.rb:124-127` does.

## Acceptance criteria

- [ ] `deepDup` mirrors `builder.rb:118-122` through `dup` and `rbObjIvarSet`.
- [ ] `initializeDup` mirrors `builder.rb:124-127`.
- [ ] `attribute-set/**` tests stay green.
