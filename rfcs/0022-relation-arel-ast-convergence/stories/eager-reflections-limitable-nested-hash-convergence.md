---
title: "Converge _eagerReflectionsAreLimitable to resolve nested-hash/array eager specs via JoinDependency reflections"
status: claimed
updated: 2026-06-24
rfc: "0022-relation-arel-ast-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: "2026-06-24T23:42:35Z"
assignee: "eager-reflections-limitable-nested-hash-convergence"
blocked-by: null
---

## Context

`_eagerReflectionsAreLimitable` (`packages/activerecord/src/relation.ts:4933`)
resolves the first `using_limitable_reflections?` clause
(`eager_load_values | includes_values`) but returns `false` for every
**non-string** spec (`if (typeof spec !== "string") return false`). Rails
keeps `Hash`/`Symbol`/`Array` association specs and resolves them via
`construct_join_dependency(...).reflections` before `none?(&:collection?)`
(finder_methods.rb:457-470, join_dependency.rb:81-82).

PR #4073 (story `using-limitable-reflections-joins-leftjoins-convergence`)
converged the SECOND clause (`joins ∪ left_outer_joins`) to a JoinDependency
reflection walk via the new `_joinsReflectionsAreLimitable`, but deliberately
left the eager clause untouched to keep scope small. So a limitable eager
relation declared with a nested-hash spec — e.g. `eagerLoad({ author: "profile" })`
with both singular — is still wrongly classified as non-limitable and forced
into `distinct_relation_for_primary_key` materialization / the
`applyJoinDependencyForArel` NotImplemented path.

## Scope

Converge `_eagerReflectionsAreLimitable` to resolve eager specs through a
JoinDependency and check `jd.reflections` (the same shape
`_joinsReflectionsAreLimitable` now uses), so nested-hash/array eager specs
contribute every reflection in the tree rather than short-circuiting to
non-limitable. Both clauses of `_applyJoinDependencyIsLimitable` would then
share one reflection-resolution path.

## Acceptance criteria

- [ ] `_eagerReflectionsAreLimitable` resolves nested-hash/array eager specs
      to their full reflection set (mirroring construct_join_dependency.reflections)
      instead of returning false for non-string specs.
- [ ] A limit/offset relation with a singular nested-hash eager spec is NOT
      deferred (`_isDeferredDistinctPkSubquery() === false`); one with a
      collection anywhere in the eager tree still defers.
- [ ] test:compare / api:compare delta >= 0.
