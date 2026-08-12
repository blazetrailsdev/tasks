---
title: "Collection target store ownership is inverted: proxy owns it, association views it through a _shared* bridge"
status: draft
updated: 2026-08-12
rfc: "0075-collection-association-target-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' ownership is unambiguous: `CollectionAssociation` owns `@target`,
`@loaded` and `@replaced_or_added_targets`, and `CollectionProxy` is a thin
delegator onto it.

```ruby
# collection_proxy.rb:41,45,54
def target;      @association.target;      end
def load_target; @association.load_target; end
def loaded?;     @association.loaded?;     end
```

```ruby
# collection_association.rb:31, 281-283, 457-489
attr_reader :target
# add_to_target / replace_on_target mutate @target and @replaced_or_added_targets
```

trails inverts it (RFC 0022 made the proxy the canonical has_many store, since
`Base#_associationCache` surfaces the proxy). The proxy owns the arrays and the
association reads them back through a bridge:

```ts
// collection-association.ts
override get target(): Base[] {
  const store = this._sharedStore();
  return store ? store._sharedTarget : (this._targetStore as Base[]);
}
// same shape for `loaded` and `_replacedOrAddedTargets`
```

```ts
// collection-proxy.ts
get _sharedTarget(): T[] { return this._target; }
set _sharedTarget(records: T[]) { this._target = records; }
// _sharedLoaded / _sharedReplacedOrAddedTargets likewise
```

This is genuinely ONE store — `collection-association-wrapper-target-is-second-write-store`
converged that and is closed, and PR #6426 removed the last duplicated
`replace_on_target` body on top of it. What remains is the _direction_: the
`_sharedStore()` / `_sharedTarget` / `_sharedLoaded` /
`_sharedReplacedOrAddedTargets` / `_adoptSharedTarget` bridge is five accessor
pairs with no Rails counterpart, and the fallback arms (`_targetStore`,
`_loadedStore`, `_replacedOrAddedTargetsStore`, used when no proxy is
registered) mean the association silently has a second home for its state
whenever `owner._collectionProxies` has no entry for the reflection.

## Converged shape

`CollectionAssociation` owns `target` / `loaded` / `_replacedOrAddedTargets`
outright (`collection_association.rb:31`), and `CollectionProxy#target`,
`#loadTarget` and `#loaded` delegate to it per `collection_proxy.rb:41-54`. The
`_shared*` bridge and the `*Store` fallback fields are deleted, and
`Base#_associationCache` resolves through the association rather than the proxy.

This is the load-bearing prerequisite for
`collection-proxy-holds-association-ivar-not-per-call-lookup`; sequence them
together or store-direction first.

## Acceptance criteria

- [ ] `_sharedStore` / `_sharedTarget` / `_sharedLoaded` /
      `_sharedReplacedOrAddedTargets` / `_adoptSharedTarget` are gone.
- [ ] `CollectionAssociation` holds the arrays; `CollectionProxy` reads them
      through the association, matching `collection_proxy.rb:41-54`.
- [ ] No fallback second store on either side.
- [ ] `packages/activerecord/src/associations/` stays green.
