---
title: "findsti-namespace-relative-fallback"
status: done
updated: 2026-06-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4005
claim: "2026-06-23T14:14:30Z"
assignee: "findsti-namespace-relative-fallback"
blocked-by: null
---

## Context

Follow-up from PR #3975 review (story `compute-type-namespace-relative-resolution`).
That PR made `computeType`, `stiClassFor`, and `polymorphicClassFor` honor the
`storeFull*` flags and do Ruby-style namespace-relative resolution, and rewired
the polymorphic `belongs_to` read path through `polymorphicClassFor`.

The STI _row-hydration_ read path resolves namespaced demodulized types via
`stiName` matching in `findStiClassInHierarchy`
(`packages/activerecord/src/inheritance.ts`), so the common (tracked-subtree)
case already works without a registry hit (test: "hydrates a namespaced STI
subclass from its demodulized stored type"). But the bare-`findStiClass`
fallback in `findStiClassForRow` / `subclassFromAttributesForNew` (taken when a
hierarchy has explicit `enableSti` and the subclass is registered _only_ under
its namespaced key and is NOT a tracked descendant) still does a bare
`modelRegistry.get(typeName)` (`findStiClass`, inheritance.ts) and so misses a
demodulized type where Rails' `find_sti_class` → `sti_class_for` →
`compute_type` would resolve it namespace-relative.

Rails: `find_sti_class` (inheritance.rb:311-320) calls `sti_class_for`
(:242-265), which branches on the flags (constantize vs `compute_type`).

## Acceptance criteria

- [ ] `findStiClass` (or its `findStiClassForRow` / `subclassFromAttributesForNew`
      fallback callers) routes through the flag-aware namespace-relative resolver
      (`stiClassFor` / `resolveComputedType`) instead of a bare
      `modelRegistry.get`, so an explicitly-STI-enabled hierarchy resolves a
      namespaced subclass from a demodulized stored type when
      `store_full_sti_class = false`.
- [ ] A test exercises STI row read for an `enableSti` hierarchy whose namespaced
      subclass is registered only under its namespaced key and is not a tracked
      descendant.
- [ ] No regression to the registry-safety deviations documented on
      `findStiClassForRow` / `findStiClassInHierarchy`.
