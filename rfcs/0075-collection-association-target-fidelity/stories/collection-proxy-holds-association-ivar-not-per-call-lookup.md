---
title: "CollectionProxy re-resolves its association per call instead of holding Rails' @association"
status: draft
updated: 2026-08-12
rfc: "0075-collection-association-target-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `CollectionProxy` is _handed_ its association and holds it in an ivar,
then delegates every mutation to it:

```ruby
# collection_proxy.rb:32-33
def initialize(klass, association, **)
  @association = association
```

```ruby
# collection_proxy.rb:41,45,54
def target;      @association.target;      end
def load_target; @association.load_target; end
def loaded?;     @association.loaded?;     end
```

trails' proxy is built from the reflection, not handed the association, so it
re-resolves it on every call. PR #6426 concentrated the scattered
`this._record.association(this._assocName) as unknown as CollectionAssociation`
casts into one reader:

```ts
// collection-proxy.ts — _collectionAssociation()
private _collectionAssociation(): CollectionAssociation {
  return this._record.association(this._assocName) as unknown as CollectionAssociation;
}
```

That is one reader instead of ~10 inline casts, but it is still a per-call
lookup where Rails has a held reference, and the `as unknown as` cast is doing
real work — `Base#association()` returns a loosely-typed wrapper, so every
proxy→association call is unchecked at the boundary.

Sibling inline casts remain at `collection-proxy.ts` (the
`_throughAssociation()` handle, `_cascadeStrictLoading`, `_buildRecord`,
`create`, and several more), each re-deriving the same object with its own
ad-hoc structural type.

## Converged shape

One typed reference to the association, established where the proxy is
constructed (Rails' `@association = association`), with `_throughAssociation()`
and the remaining structural-cast call sites reading it. `CollectionProxy#target`
/ `loadTarget` / `loaded` then read through it the way `collection_proxy.rb:41-54`
does, rather than through the proxy's own fields.

Note the ordering constraint: the store-direction inversion (proxy owns
`_target`, association views it via `_sharedStore()`) has to be settled first
or in the same pass — see the sibling story
`collection-proxy-store-direction-is-inverted-vs-rails`.

## Acceptance criteria

- [ ] `CollectionProxy` holds one typed association reference rather than
      re-resolving it per call.
- [ ] The `as unknown as CollectionAssociation` / ad-hoc structural casts at the
      proxy's association call sites are gone.
- [ ] `packages/activerecord/src/associations/` stays green.
