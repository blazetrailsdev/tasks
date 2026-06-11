---
title: "(optional) Converge onto one @association_cache map"
status: draft
updated: 2026-06-10
rfc: "0022-singular-association-holder"
cluster: associations
deps: ["b4-delete-cached-associations"]
deps-rfc: []
est-loc: 200
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Even after `_cachedAssociations` is gone (b4), trails still carries three
parallel per-record maps: `_preloadedAssociations`, `_collectionProxies`, and
`_associationInstances`. Rails has exactly one — `@association_cache` (name →
Association object, with the target inside). This optional capstone folds the
remaining seams toward that single map for full Rails parity. Orthogonal to the
deletion, hence sequenced last and marked optional.

## Acceptance criteria

- [ ] `_preloadedAssociations` is folded into the holder / proxy (preloading
      writes the association object's target, as Rails preloads into
      `@association_cache`), or an explicit decision recorded that it stays as a
      named preload seam with rationale.
- [ ] `_collectionProxies` + `_associationInstances` (+ the b1 holders) are
      reachable through one memoization slot mirroring `@association_cache`, or a
      decision recorded that they remain split with rationale.
- [ ] No behavior change; all suites pass; no test renames.
- [ ] `api:compare` delta non-negative on `associations.rb`
      (`association_instance_get` / `association_instance_set` / `association`).

## Notes

Scope-gate this carefully — it can balloon. Prefer a measured single-seam fold
(`_preloadedAssociations` first) over a big-bang map unification. May itself need
to be re-sliced into per-seam stories. Rails source: `associations.rb:51-87`,
`associations/preloader/association.rb`.
