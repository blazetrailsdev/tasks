---
title: "Converge delegatedClasses() onto Rails' literal delegated_classes list"
status: draft
updated: 2026-08-29
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Delegation.delegated_classes` is a literal four-element array:

```ruby
# vendor/rails/activerecord/lib/active_record/relation/delegation.rb:8-15
def delegated_classes
  [
    ActiveRecord::Relation,
    ActiveRecord::Associations::CollectionProxy,
    ActiveRecord::AssociationRelation,
    ActiveRecord::DisableJoinsAssociationRelation,
  ]
end

def uncacheable_methods
  @uncacheable_methods ||= (
    delegated_classes.flat_map(&:public_instance_methods) -
      ActiveRecord::Relation.public_instance_methods
  ).to_set.freeze
end
```

trails carries TWO representations of that one Ruby method, and
`uncacheable_methods`' port reads the one that is NOT Ruby-named:

- `delegatedClasses()` (`packages/activerecord/src/relation/delegation.ts:110-112`)
  returns `_delegatedClasses`, a `Set<typeof Base>` populated at runtime by
  registration calls (`:181`, `:186`). It carries the Rails name but not the
  Rails semantics — Rails' list is a fixed literal, not a registry.
- `_relationFamilySlot` holds the same four classes as named fields, and is
  what `computeUncacheableMethods` actually destructures.

PR #7194 converged the BODY of `computeUncacheableMethods` onto Rails' set
subtraction (it now unions all four classes' `publicInstanceMethods()` and
subtracts `Relation`'s, matching `delegation.rb:19-20` exactly). It deliberately
did not touch the list SOURCE, which was out of that story's scope. So the
remaining divergence is narrow and well-isolated: the subtraction is faithful,
the thing being subtracted over is reached by a non-Rails path.

The hazard is that `delegatedClasses()` reads as the port of `delegated_classes`
to anyone grepping for the Ruby name, while the only caller that matters uses
the slot instead — two spellings of one Ruby method, which is the same drift
class #7194 closed for `public_instance_methods`.

## Converged shape

One Ruby-named accessor returning Rails' literal list, with
`computeUncacheableMethods` calling it:

```ts
for (const klass of delegatedClasses()) {
  for (const n of publicInstanceMethods(klass)) result.add(n);
}
```

Decide which representation survives. The slot is the faithful one (a fixed
list of exactly Rails' four), so the likely shape is `delegatedClasses()`
returning the slot's four entries in Rails' order, with the runtime registry
either removed or renamed to whatever non-Rails job it actually does. Check
`_delegatedClasses`' other consumers (`:195`) before collapsing them — if the
registry is load-bearing for something Rails spells differently, that is a
separate name, not this one.

## Acceptance criteria

- One Ruby-named `delegatedClasses()` mirroring `delegation.rb:8-15`, returning
  Rails' four classes in Rails' order.
- `computeUncacheableMethods` iterates it rather than destructuring
  `_relationFamilySlot` directly.
- Any surviving runtime registry no longer occupies the Rails name.
- `packages/activerecord/src/relation/delegation.test.ts` passes unchanged.
- `pnpm parity:api:calls` stays green — `uncacheable_methods` makes the
  `delegated_classes` call in Ruby, so the TS body must make it too.
