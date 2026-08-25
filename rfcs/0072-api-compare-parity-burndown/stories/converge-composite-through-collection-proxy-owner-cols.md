---
title: "converge-composite-through-collection-proxy-owner-cols"
status: done
updated: 2026-08-07
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6201
claim: "2026-08-07T21:12:47Z"
assignee: "converge-composite-through-collection-proxy-owner-cols"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `converge-singular-find-target-test-callers-to-the-reader`.

`packages/activerecord/src/associations/disable-joins-composite-nested.test.ts:175,199`
call the free `findTarget(shop, "cknLineItemTags", reflection.options)` from
`associations/has-many-association.ts`. Both were converted to the association
reader (`shop.cknLineItemTags.toArray()`, which is what the Rails test shape
would use) and both then failed:

````text
Error: Composite primaryKey/foreignKey mismatch on through "cknLineItemTags": 1 pk vs 2 fk
  ❯ subclass._throughOwnerCols  associations/collection-proxy.ts:2166
  ❯ subclass._buildThroughScope associations/collection-proxy.ts:3583
  ❯ new CollectionProxy         associations/collection-proxy.ts:636
```text

`CknShop` has a scalar PK; the through reflection's FK is the composite
(`ckn_order_shop_id`, `ckn_order_number`) on `CknLineItem`. The loader path
handles that pair (the tests pass through it today); `CollectionProxy`'s
`_throughOwnerCols` requires `fkCols.length === pkCols.length` and raises.
This is another instance of the known
`collection-proxy-and-oo-association-have-separate-targets` split: the reader
and the loader are two implementations of the same Rails method with different
behaviour.

Rails has one path —
`vendor/rails/activerecord/lib/active_record/associations/association_scope.rb`
builds the through chain from the reflection chain and never compares owner-PK
arity to the through FK arity directly.

The two call sites are marked "no reader form yet" with a pointer to this story;
they must be converged to the reader once the proxy handles the pair.

## Acceptance criteria

- [ ] `CollectionProxy#_throughOwnerCols` (or whatever survives the
      collection-proxy convergence) handles a scalar owner PK reaching a
      composite through FK the same way the loader path does.
- [ ] `disable-joins-composite-nested.test.ts:175,199` route through
      `shop.cknLineItemTags` and the "no reader form yet" notes are deleted.
- [ ] No test names change; sqlite/PG/MySQL lanes green.
````
