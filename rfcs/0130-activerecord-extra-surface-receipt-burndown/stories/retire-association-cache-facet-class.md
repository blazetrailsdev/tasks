---
title: "retire-association-cache-facet-class"
status: claimed
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 9
pr: null
claim: "2026-09-24T16:13:07Z"
assignee: "converge-invented-association-scope-and-key-helpers"
blocked-by: null
closed-reason: null
---

## Context

Split out of `relabel-invented-association-helper-permanent-receipts`.
`packages/activerecord/src/association-cache.ts` carries a file-level
`@noRailsEquivalent` receipt (now `CONVERGEABLE` pointing here) covering
`AssociationCache`, `AssociationCacheFacet` and their Map-protocol members
(`clear`, `delete`, `entries`, `forEach`, `get`, `keys`, `proxies`, `set`,
`size`, `store`, `values`, `[Symbol.iterator]`, `[Symbol.toStringTag]`).

Rails keeps `@association_cache` as a plain Hash
(`activerecord/lib/active_record/associations.rb:66-87`:
`association_cached?` is `@association_cache.key?(name)`, `init_internals` /
`initialize_dup` reset it to `{}`, `association_instance_get` /
`association_instance_set` index it). trails splits each slot into an
`instance` and a `proxy` facet. Prior art `b5-converge-association-cache`
(RFC 0022) is `done`, yet the file remains; `base.ts` still builds
`new AssociationCache()` in `_resetAssociationCaches`.

## Acceptance criteria

- [ ] `@association_cache` is one Hash of association instances keyed by name,
      read and written only through `associationInstanceGet` /
      `associationInstanceSet` / `isAssociationCached`.
- [ ] The collection proxy is reached through the association instance
      (`CollectionAssociation#reader`), not a second cache facet.
- [ ] `association-cache.ts` is deleted, with its file-level receipt.
