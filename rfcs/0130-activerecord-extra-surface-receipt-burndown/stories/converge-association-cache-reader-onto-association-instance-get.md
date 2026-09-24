---
title: "Delete Base#_associationCache(name); rename the cache field to _associationCache"
status: draft
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8040 (retire-association-cache-facet-class). `@association_cache` is now one Map of association instances, but two invented pieces remain around it:

- `Base#_associationCache(name)` (`packages/activerecord/src/base.ts`, next to the constructor) answers "a loaded target holder" by probing the association instance's `isLoaded()`, `isCollection()` and `target.length`. Rails has no such reader. Callers:
  - `syncAssociationInstance` in `packages/activerecord/src/associations.ts` (`association(name)`), which Rails does not have either. `association` is `association_instance_get(name) || build + association_instance_set` (`activerecord/lib/active_record/associations.rb:40-62`). Also covered in part by `retire-sync-association-instance-singular-arm` (RFC 0155).
  - `packages/activerecord/src/associations/association.ts:364`.
  - Several trails tests (`collection-proxy.trails.test.ts`, `association-relation.trails.test.ts`, `inverse-associations.test.ts`, `replace-on-target-inversing.trails.test.ts`).
- The ivar is spelled `_associationInstances`, where Rails' is `@association_cache` (`associations.rb:66-87`). That name is taken by the invented reader above.

## Acceptance criteria

- [ ] `Base#_associationCache(name)` is deleted. Its callers read the association through `associationInstanceGet` / `association(name)` and ask it `isLoaded()` / `target`, as Rails callers do.
- [ ] The cache field is renamed to `_associationCache`, the Rails ivar name, and is read and written only through `associationInstanceGet` / `associationInstanceSet` / `isAssociationCached` in src.
- [ ] Tests that read the cache use `association(name)` rather than the field.
