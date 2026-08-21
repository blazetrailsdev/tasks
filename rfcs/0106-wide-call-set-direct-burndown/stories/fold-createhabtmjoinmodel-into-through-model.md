---
title: "Route Builder::HasAndBelongsToMany#_build through throughModel/middleReflection instead of createHabtmJoinModel"
status: in-progress
updated: 2026-08-21
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6836
claim: "2026-08-21T19:20:36Z"
assignee: "converge-enumerable-min-receiver-call-shape"
blocked-by: null
closed-reason: null
---

## Context

`Builder::HasAndBelongsToMany#build` is one method in Rails: it calls
`through_model`, sets the constant, calls `middle_reflection(join_model)`, and
defines the callbacks
(`activerecord/lib/active_record/associations/builder/has_and_belongs_to_many.rb`
via `associations.rb:1866-1900`). trails has all three pieces —
`throughModel()` and `middleReflection()` mirror Rails — but `_build`
(`packages/activerecord/src/associations/builder/has-and-belongs-to-many.ts`)
calls NEITHER: it re-derives the join model through
`deps.createHabtmJoinModel` (associations.ts:1599) and the middle reflection
through an inline `Reflection.create`, so `throughModel` / `middleReflection`
are dead code that only the trails-only unit test exercises.

PR #6827 converged the two bodies and made the active path resolve its join
table lazily, but the duplication itself remains: two implementations of the
same Rails method, only one of them reachable.

## Converged shape

`_build` calls `this.throughModel()` and `this.middleReflection(joinModel)`,
and `createHabtmJoinModel` folds into `throughModel` — the trails-only extras it
carries (composite PK, `connection` / `_connectionSpecificationName` delegation,
`moduleName` propagation) move onto the subclass `throughModel` already builds,
each justified where it sits. One Rails method is one TS method.
