---
title: "Converge CollectionProxy#size / #empty? onto the association"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6679
claim: "2026-08-17T23:58:00Z"
assignee: "converge-collection-proxy-size-onto-association"
blocked-by: null
closed-reason: null
---

# Converge CollectionProxy#size / #empty? onto the association

## Context

Rails' `CollectionProxy` does not count anything itself:

```ruby
def size            # collection_proxy.rb:782-784
  @association.size
end

def empty?          # collection_proxy.rb:831-833
  @association.empty?
end
```

trails' `CollectionProxy` reimplements both against its own state
(`packages/activerecord/src/associations/collection-proxy.ts`): `size()` at
~:1159 replays all five `CollectionAssociation#size` arms
(collection_association.rb:209-222) a second time, `isEmpty()` at ~:1264 replays
`empty?` (collection_association.rb:233-237) with an extra through-association
arm, and three private helpers exist only to feed them — `_countRecords()`,
`_findTarget()` / `_foreignKeyPresent()`, and `_cachedAssociationIds()`, the last
of which reaches back into `record._associationInstances` to read the OO
association's `_associationIds` ivar.

PR #6674 put every Rails arm on `CollectionAssociation#size`, so the duplicate is
now a straight second copy of a body that already exists at the Rails name. It
was left in place there because the proxy holds no real association — its
`proxyAssociation` getter (~:2679) synthesizes a façade object
(`{ owner, reflection, target, loaded, reset }`) rather than returning the
`CollectionAssociation` instance Rails' `@association` is.

## Converged shape

Give `CollectionProxy` the real `CollectionAssociation` as `@association`
(`record._associationInstances.get(name)`, which `_cachedAssociationIds` already
reaches for), then reduce `size()` to `this.association.size()` and `isEmpty()`
to `this.association.isEmpty()` and delete `_countRecords`, `_findTarget`,
`_foreignKeyPresent` and `_cachedAssociationIds`. `proxyAssociation`
(collection_proxy.rb:944) then returns that association instead of the façade.

Watch two things: the proxy's `scope()` carries in-place `whereBang`/`limitBang`
mutations the association's own scope does not, and the through-association arm
in the proxy's `isEmpty()` routes through `count()` rather than `exists()` — check
each against Rails before dropping it, and file separately if either turns out to
be load-bearing.

## Acceptance criteria

- [ ] `CollectionProxy#size` is `@association.size`; `#empty?` is
      `@association.empty?`.
- [ ] The four proxy-private counting helpers are gone.
- [ ] `proxyAssociation` returns the real association.
- [ ] has_many / HMT / HABTM / collection-proxy suites green on all three adapters.
