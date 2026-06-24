---
title: "converge-has-one-through-preloaded-reader-arity"
status: in-progress
updated: 2026-06-24
rfc: "0022-singular-association-holder"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 20
pr: 4066
claim: "2026-06-24T16:27:37Z"
assignee: "converge-has-one-through-preloaded-reader-arity"
blocked-by: null
---

## Context

While removing the `_preloadedAssociations` shadow map (story
`remove-preloaded-associations-shadow-map`, PR #4039), the test
`PreloaderTest > preload with available records with through association`
(`packages/activerecord/src/associations.test.ts`) exposed a pre-existing
reader divergence: on the preload-with-`availableRecords` path, a
`has_one :through` holder exposes its target as a **1-element array** rather
than the single record.

Root cause: the singular reader resolves through `Base#_associationCache`
→ `syncAssociationInstance`
(`packages/activerecord/src/associations/instance-methods.ts`), which prefers a
`CollectionProxy` whose target is the source-records array and calls
`instance.setTarget(proxy.target)` — so `record.association("essayCategory")
.target` / `.reader` / the dotted reader all return `[category]`.

Rails stores the single record in `@association_cache[:essay_category]`
(`@target` is the unwrapped Category). The shadow map previously stored the
unwrapped single, which is why the test passed before reading the holder; it now
unwraps `holderTarget[0]` with a TODO pointing here.

Note: the sibling test `preload through association` reads the same association
via `.reader` and gets a single record, so the divergence is specific to the
single-owner / `Category.all()` availableRecords shape — worth pinning down
during convergence.

## Acceptance criteria

- [ ] `record.association(name)` for a preloaded `has_one :through` exposes the
      single target record (not a 1-element array) on all preload paths,
      including preload-with-`availableRecords`.
- [ ] Remove the `Array.isArray(holderTarget) ? holderTarget[0] : holderTarget`
      unwrap workaround in `associations.test.ts` (`preload with available
records with through association`) and assert the holder target directly.
- [ ] api:compare + test:compare deltas non-negative.
