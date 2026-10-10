---
title: "AutosaveAssociation#reload threads its super as a trailing parameter and is wired by a hand-rolled defineProperty"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails PR 8417, which ported `AttributeMethods::Dirty#reload` and wired it beneath
`AutosaveAssociation#reload`.

Rails' `AutosaveAssociation#reload`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/autosave_association.rb:238-242`):

```ruby
def reload(options = nil)
  @marked_for_destruction = false
  @destroyed_by_association = nil
  super
end
```

trails' port (`packages/activerecord/src/autosave-association.ts:35-44`) is
`reload(this, options, superFn)`: the next implementation arrives as a trailing third parameter
Rails does not declare. It is not installed with `prepend()` either. `base.ts` (the block after
`prepend(Base.prototype, { reload: _AttributeMethodsDirty.reload as PrependMethod })`) captures
`Base.prototype.reload` into a local `inheritedReload` and redefines the property by hand with
`Object.defineProperty`, calling `_autosaveReload.call(this, options, inheritedReload)`.

Because the extra parameter trails the Rails one, `pnpm parity:api --arity` does not list it, and
`activerecord-super-first-parameters-onto-super-method` (whose criterion is "no activerecord row
whose TS signature opens with `super_`") does not cover it. It is the same deviation in a shape
neither gate sees.

The chain it sits in is, outermost first, `AutosaveAssociation#reload` ->
`AttributeMethods::Dirty#reload` (`attribute_methods/dirty.rb:63-68`) -> `Persistence#reload`
(`persistence.rb:742-757`). `Aggregations#reload` (`aggregations.rb:11-14`) already reaches the next
link through `Aggregations.superMethod(this, "reload")`.

## Converged shape

`reload(options = nil)` takes Rails' parameter list, sets the two ivars, and reaches the next
implementation through the module's `superMethod(this, "reload")`, as
`activerecord-super-first-parameters-onto-super-method` converges the `super_`-first methods. The
hand-rolled `Object.defineProperty` block and the `inheritedReload` local in `base.ts` are deleted.
Sequence with that story, since both rebuild the same links on `Base`.

## Acceptance criteria

- [ ] `AutosaveAssociation#reload` in `autosave-association.ts` declares `(options)` only and calls `super` through `superMethod`.
- [ ] `base.ts` has no `inheritedReload` local and no `Object.defineProperty(Base.prototype, "reload", ...)` block.
- [ ] `reload` still clears `marked_for_destruction` and `destroyed_by_association`, then the dirty trackers; `autosave-association.test.ts`, `dirty.test.ts` and `persistence.test.ts` stay green.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
