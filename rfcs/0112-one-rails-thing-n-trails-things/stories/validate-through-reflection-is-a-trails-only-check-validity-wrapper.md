---
title: "validate-through-reflection.ts is a trails-only wrapper around check_validity!"
status: ready
updated: 2026-08-31
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# `validate-through-reflection.ts` is a trails-only wrapper around `check_validity!`

## Context

Surfaced converging `validate-inverse-of-is-a-trails-invention` in PR 7246,
which deleted `validateInverseOf` and left the reflection path as the single
validation route. That path is reached through a trails-only module.

Rails calls the reflection directly, with no wrapper and no memoization —
`activerecord/lib/active_record/associations/association.rb:42`:

    def initialize(owner, reflection)
      reflection.check_validity!
      ...

and `join_dependency.rb:231` likewise calls `reflection.check_validity!`.

`packages/activerecord/src/associations/validate-through-reflection.ts` instead
exports three functions with no Rails counterpart —
`validateReflectionValidity`, `validateThroughReflection` and
`routeThroughCheckValidity` (the last is a bare one-line alias of the first) —
each duck-typing `_reflectOnAssociation` and memoizing the outcome on the
reflection under two module-private symbols (`CHECKED_OK` / `CHECKED_ERROR`),
re-throwing the cached error on later calls. Rails memoizes nothing here:
`check_validity!` re-runs on every `Association#initialize`.

`Association`'s constructor
(`packages/activerecord/src/associations/association.ts:70`) calls
`validateReflectionValidity(owner.constructor, reflection.name)` where Rails
writes `reflection.check_validity!`.

## Converged shape

Delete `validate-through-reflection.ts`. Call `this.reflection.checkValidityBang()`
directly from `Association`'s constructor, mirroring association.rb:42, and
replace the remaining `validateThroughReflection` / `routeThroughCheckValidity`
call sites with the same direct call. Drop the symbol-keyed memoization unless a
Rails line is found for it.

## Acceptance criteria

- [ ] `validate-through-reflection.ts` is gone; no caller routes
      `checkValidityBang` through a helper.
- [ ] `Association`'s constructor reads `reflection.check_validity!`'s shape.
- [ ] The memoization is either traced to a Rails line or dropped.
- [ ] `pnpm parity:api:extra --package activerecord` does not grow; all three
      adapter lanes green.
