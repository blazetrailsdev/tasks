---
title: "Migrate _preloadedAssociations shadow readers in associations.ts to read from the real CollectionProxy/Association"
status: claimed
updated: 2026-06-23
rfc: "0022-singular-association-holder"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 5
pr: null
claim: "2026-06-23T16:52:38Z"
assignee: "migrate-preloaded-associations-shadow-readers-to-proxy"
blocked-by: null
---

## Context

RFC 0022 moved singular-association state onto the real `Association` /
`CollectionProxy` holder (`record.association(name).target`, Rails' `@target`)
as the single source of truth. The preloader was updated to write the loaded
records onto that holder via `association.setTarget(value)`
(`associations/preloader/association.ts:218,239,247`). But for backward
compatibility it ALSO still mirrors every preload into the legacy
`record._preloadedAssociations` shadow `Map`
(`preloader/association.ts:222,253` — the in-code comment names this exact
follow-up: "Shadow-map bridge: many readers in `associations.ts` still consult
`_preloadedAssociations`. Migrating them to read from the real proxy is a
follow-up PR; keep the cache in sync for now."). `JoinDependency` populates the
same shadow map (`associations/join-dependency.ts:1277,1281,1284,1359,1362`),
as do `persistence.ts:1257` and `preloader/batch.ts:98`.

This story migrates the **readers** that still consult the shadow map so they
read the loaded target from the real holder instead, removing the parallel
source of truth. The shadow readers in `associations.ts`:

- `_loadedSingularTarget` — `associations.ts:480` (singular fallback box).
- `associations.ts:1727` — collection reader (`has() → get() as Base[]`).
- `associations.ts:2667` — through-collection reader.
- `associations.ts:2992`, `associations.ts:3039` — `record._preloadedAssociations?.get(assocName)`.

Plus the through-preloader readers that gate on the shadow map:
`preloader/through-association.ts:56,282,293`, and the proxy-copy path in
`associations/instance-methods.ts:61` (which already prefers
`_associationCache` and only falls back to `_preloadedAssociations`).

The migration target is the loaded holder: `record.association(name)` →
`isLoaded()` + `target` (the same accessor `_loadedSingularTarget` already
consults for the explicit-set case). The preloader already calls
`setTarget(...)`, so the data is present on the holder; the readers just need to
prefer it. Note the nil-association subtlety: the preloader records a loaded-nil
via `Map.set(name, null)` / `setTarget(null)`, so readers must use the holder's
`isLoaded()` (not target truthiness) to distinguish a loaded-nil from a miss —
exactly as `instance-methods.ts:61` documents.

Once all readers route through the holder, the shadow-map **writes**
(`preloader/association.ts:222,253`, `batch.ts:99`,
`join-dependency.ts:1281/1284/1362`, `persistence.ts:1257`) and the
`_preloadedAssociations` field itself can be dropped — but only if that fits the
500-LOC ceiling; otherwise land the reader migration here and register the
write/field removal as a follow-up story.

## Acceptance criteria

- [ ] Every `_preloadedAssociations` reader in `associations.ts` (480, 1727,
      2667, 2992, 3039) reads the loaded value from the real holder
      (`record.association(name)` `isLoaded()`/`target`) instead of the shadow
      `Map`, preserving loaded-nil vs miss semantics (use `isLoaded()`, not
      truthiness).
- [ ] The through-preloader readers (`preloader/through-association.ts:56,282,293`)
      and the `instance-methods.ts:61` copy path are migrated or confirmed to
      already prefer the holder.
- [ ] If within the LOC ceiling: the shadow-map writes and the
      `_preloadedAssociations` field are removed; otherwise a follow-up story is
      registered for the write/field removal and the bridge comment in
      `preloader/association.ts:251` is updated to point at it.
- [ ] No behavior change: eager-load / preload / `JoinDependency` paths still
      mark associations loaded and return the same targets; the
      `_preloadedAssociations`-asserting tests in `associations.test.ts` are
      updated to assert via the public proxy (`record.assoc` / `association(name)`)
      rather than the private map, or kept green if the field is retained.
- [ ] api:compare + test:compare deltas non-negative.
