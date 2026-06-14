---
title: "Fold _associationInstances/_collectionProxies/_preloadedAssociations into one @association_cache slot"
status: in-progress
updated: 2026-06-14
rfc: "0022-singular-association-holder"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 3296
claim: "2026-06-14T22:05:11Z"
assignee: "fold-three-association-maps-into-one"
blocked-by: null
---

## Context

Follow-up to `b5-converge-association-cache` (merged PR #3194). That capstone
unified the _lifecycle_ of the three per-record association maps behind one
seam (`Base#_resetAssociationCaches`) but deliberately kept the maps
**physically split**, recording the decision rather than performing the fold:

- `_associationInstances` — canonical `@association_cache` analog (what
  `association_instance_get/set` and `association()` read/write).
- `_collectionProxies` — Trails-specific user-facing `CollectionProxy` layer
  (incl. in-memory inverse-seeded records on a not-yet-loaded proxy); Rails'
  proxy lives _inside_ the Association object.
- `_preloadedAssociations` — preloaded-target shadow; the only store that can
  express an eagerly-preloaded _nil_ association (`set(name, null)`) distinctly
  from "never loaded".

Rails has exactly one map (`@association_cache`, name → Association object with
the target/proxy/loaded-nil all inside). Folding ours into one slot is the
remaining convergence for full parity. It was scoped out of b5 because it
touches ~15 semantically-subtle read sites across ~9 files (association.ts,
through-association.ts, batch.ts, join-dependency.ts, autosave-association.ts,
validations.ts, nested-attributes.ts, instance-methods.ts, persistence.ts) and
exceeds a single 300-LOC PR.

Rails source: `associations.rb:51-87`, `associations/preloader/association.rb`.
Likely needs re-slicing into per-seam stories (fold `_preloadedAssociations`
first, then collapse `_collectionProxies`/`_associationInstances`).

## Acceptance criteria

- [ ] The three maps are reachable through one memoization slot mirroring
      Rails' `@association_cache` (or re-sliced into per-seam stories that
      collectively achieve this).
- [ ] No behavior change; all suites pass; no test renames.
- [ ] `api:compare` delta non-negative on `associations.rb`.
