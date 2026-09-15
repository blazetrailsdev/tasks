---
title: "Converge CollectionProxy scope delegates; delete wrapCollectionProxy"
status: done
updated: 2026-09-15
rfc: "0075-collection-association-target-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#7817
claim: "2026-09-15T18:58:09Z"
assignee: "converge-collection-proxy-scope-delegates-drop-wrap-collection-proxy"
blocked-by: null
closed-reason: null
---

## Context

After trails#7809, `Relation`'s constructor (`packages/activerecord/src/relation.ts`) returns the `method_missing` trap for every `ClassSpecificRelation` delegate, mirroring `relation/delegation.rb:35-37,114-131`. `associations.ts#wrapCollectionProxy` still layers a second Proxy over that already-trapped `CollectionProxy`. The second layer adds numeric indexing and forwards to `scope()` for the `delegate(*delegate_methods, to: :scope)` list (`associations/collection_proxy.rb:1128-1137`), and `_proxySelf` exists only to hand that outer proxy back.

## Acceptance criteria

- The `collection_proxy.rb:1128-1137` scope delegation is real `CollectionProxy` members, not a trap lookup.
- `wrapCollectionProxy` and `_proxySelf` are deleted, and `collectionProxyFor` caches the constructed proxy directly.
- The `CollectionProxy` tests stay green.
