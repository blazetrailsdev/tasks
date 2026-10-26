---
title: "Every plain-object module carries a marker rbEqual and rbObjIsKindOf read"
status: in-progress
updated: 2026-10-26
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#9328
claim: "2026-10-26T01:18:25Z"
assignee: "configuration-test-framework-deprecators"
blocked-by: null
closed-reason: null
---

## Context

trails#9277 made `rbEqual` / `rbEql` (`packages/ruby-compat/src/rb-equal.ts`, `isHash`) answer identity (`rb_obj_equal`, `vendor/ruby/v3.3.11/object.c:4374`) for a plain object that owns the `moduleIncludes` key or the `moduleVisibility` stamp that `defineModule` sets. A plain object-literal module (`const FooHelper = { ... }`) that never went through `defineModule`, `include()` or `rbModConstSet` carries no marker. It is still compared by entries as a Hash (`rb_hash_equal`, `hash.c:3808`), and `Object.entries` runs its getters. `rbObjIsKindOf` (`include.ts`) has the same gap: it counts only a classpath or `moduleVisibility` as a module marker.

## Acceptance criteria

- Every module-defining path marks its object. Converge the object-literal helper modules onto `defineModule` or seat each with `rbModConstSet`, so that one predicate recognises a plain-object module.
- `rbEqual`, `rbEql`, `rbObjIsKindOf` and `rbObjClass` share that one predicate.
- A ruby-compat test shows that two never-included object-literal modules with equal members are not `rbEqual`.
