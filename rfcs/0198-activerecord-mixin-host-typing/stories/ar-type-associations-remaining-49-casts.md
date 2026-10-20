---
title: "Drop the remaining 49 associations/** casts"
status: draft
updated: 2026-10-20
rfc: "0198-activerecord-mixin-host-typing"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9106 brought the `as any|as unknown` count in `packages/activerecord/src/associations/**` (non-test) from 56 to 49
(`grep -rnE "as any|as unknown" packages/activerecord/src/associations --include=*.ts | grep -v .test.ts`).
Remaining clusters: `collection-association.ts` (~12), `collection-proxy.ts` (6), `association.ts` (5), `has-many-association.ts`
(`countRecords` casts `this.reflection as unknown as { hasActiveCachedCounter(): boolean }` — Rails `has_many_association.rb#count_records`
calls `reflection.has_active_cached_counter?` directly), `has-many-through-association.ts` (4), preloader/join-dependency (2 each).
Also `Base.destroyAssociationAsyncJob` is declared `any` (`base.ts:1704-1705`), so `association.ts#enqueueDestroyAssociation`'s
`owner.constructor as typeof Base` yields `any` (Rails `association.rb:398-404`).

## Acceptance criteria

- [ ] `hasActiveCachedCounter` is declared on the reflection types so `countRecords` calls it without a cast.
- [ ] `destroyAssociationAsyncJob` gets a real class type on Base.
- [ ] The `associations/**` count drops below 49, with no runtime change.
