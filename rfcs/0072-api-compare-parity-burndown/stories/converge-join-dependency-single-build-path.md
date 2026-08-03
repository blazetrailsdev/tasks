---
title: "Converge JoinDependency onto Rails' single build path (required ctor args, drop incremental addAssociation growth)"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: 5943
claim: "2026-08-03T01:05:45Z"
assignee: "converge-join-dependency-single-build-path"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #5930 (`converge-join-dependency-constructor-arg-order`). That PR
converged the constructor onto Rails'
`JoinDependency#initialize(base, table, associations, join_type)`
(`vendor/rails/activerecord/lib/active_record/associations/join_dependency.rb:71`)
and made it build the tree, but left two deviations in place:

- Every argument after `baseModel` is optional
  (`packages/activerecord/src/associations/join-dependency.ts`, constructor).
  Rails requires all four and never mutates the tree after `initialize`.
- trails still grows a JoinDependency incrementally after construction via
  `addAssociation` / `addAssociationSpec` / `addNestedAssociation`, so there are
  two tree builders in the class: the private `build` (a faithful port of
  `join_dependency.rb:228`, returning `JoinAssociation[]`, used only by
  `validateEagerLoadSpec`) and `_buildTree` (materializes JOIN nodes through
  `addAssociation`). Rails has only `build`.

The incremental path is what the ~10 `relation.ts` call sites and the
`join-dependency*` tests use — they construct with `baseModel` alone and add
associations later.

## Acceptance criteria

- The tree is built once in the constructor; `addAssociation` /
  `addAssociationSpec` / `addNestedAssociation` are either removed or reduced to
  internal helpers of the constructor path, and `_buildTree` folds into the
  Rails-named `build`.
- `relation.ts` call sites pass `(model, table, associations, joinType)` up front
  (they already know the associations at construction time in most paths).
- Constructor arguments become required, matching `initialize`'s arity.
- No behavior change: join SQL byte-identical; `join-dependency*`, `eager`,
  `cascaded-eager-loading`, `inner-join-association`,
  `left-outer-join-association`, `join-model` stay green.
