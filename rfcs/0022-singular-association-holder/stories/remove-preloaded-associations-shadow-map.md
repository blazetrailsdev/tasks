---
title: "remove-preloaded-associations-shadow-map"
status: ready
updated: 2026-06-23
rfc: "0022-singular-association-holder"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC 0022 made the real `Association` / `CollectionProxy` holder
(`record.association(name).target`, Rails' `@target`) the single source of
truth for preloaded/eager-loaded targets. The sibling story
`migrate-preloaded-associations-shadow-readers-to-proxy` migrated every
**reader** off the legacy `record._preloadedAssociations` shadow `Map`: readers
now gate on the holder's `isLoaded()` + a new `_loadedFromPreload` provenance
flag (`associations/association.ts`) via `_preloadedHolderTarget`
(`associations.ts`). The shadow `Map` is now **write-only**.

The remaining shadow-map **writes** still need removal:

- `associations/preloader/association.ts:226,260` (preloader mirror writes).
- `associations/preloader/batch.ts:110-111` (loaded-nil default).
- `associations/join-dependency.ts:1324,1327,1405` (JD mirror writes).
- `persistence.ts:1256-1258` (reload copies `fresh._preloadedAssociations`).

And the few remaining **non-migrated readers** of the field that still back the
field:

- `associations/association.ts:416` (`Association#doFindTarget` fallback).
- `associations/instance-methods.ts:61` (`syncAssociationInstance` fallback —
  currently load-bearing for hydrating a holder for empty preloaded collections
  where `_associationCache` returns `undefined`; migrate by ensuring the holder
  itself is loaded, then drop).
- `validations.ts:244`, `autosave-association.ts:93`.

Once those readers route through the holder, drop the writes, the
`_preloadedAssociations` field (`base.ts:2604`, `persistence.ts` interfaces),
and the `_associationCacheStore.preloaded` facet, plus the tests that still
seed/assert the private map (several in `src/associations/*.test.ts` —
e.g. `has-one-through-associations.test.ts`, `preloader-bigint-number-key-match.test.ts`,
`polymorphic-sti-through.test.ts`, `strict-loading-sync-reader.test.ts:169`).

## Acceptance criteria

- [ ] `Association#doFindTarget`, `syncAssociationInstance`, `validations.ts`,
      and `autosave-association.ts` no longer read `_preloadedAssociations`.
- [ ] All shadow-map writes (preloader, batch, JoinDependency, persistence
      reload) are removed.
- [ ] The `_preloadedAssociations` field and its backing-store facet are
      removed; remaining tests that seed/assert the private map are converted to
      the public holder/proxy.
- [ ] api:compare + test:compare deltas non-negative.
