---
title: "ArrayHandler derefs any {id}-bearing object where Rails checks is_a?(Base)"
status: claimed
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-06-21T20:06:42Z"
assignee: "array-handler-record-detection-isa-base"
blocked-by: null
---

## Context

`ArrayHandler#call` (and the negated mirror `buildNegatedArray` in
`predicate-builder.ts`) detect an AR record to deref to its PK by duck-typing
on `"id" in item && !isPlainObject(item)`. Rails' actual check is
`x.is_a?(Base) ? x.id : x` (vendor/rails/activerecord/lib/active_record/relation/predicate_builder/array_handler.rb:14).

PR #3824 converged the plain-object (Ruby Hash) case — a bare `{ id: 5 }` is no
longer deref'd, matching `respond_to?(:id)` / `is_a?(Base)` being false for a Hash.
But a residual divergence remains: a NON-Base class instance that happens to carry
an `id` property would deref in trails but NOT in Rails (it is not an AR record).
The duck-typing was chosen to avoid a circular import on `Base`
(array-handler.ts:63-65 comment).

## Acceptance criteria

- [ ] Array-handler record detection matches Rails `x.is_a?(Base)` exactly — only
      AR record instances deref to PK; arbitrary non-Base objects carrying `id` do
      not. Apply consistently to the positive `ArrayHandler#call` and the negated
      `buildNegatedArray` per-element detection.
- [ ] Resolve the `Base` import without a circular dependency (e.g. lazy/type-only
      import, an `isBaseInstance` predicate exported from a leaf module, or duck-type
      on an AR-specific brand rather than bare `id`).
- [ ] Regression test mirroring a Rails test name verbatim if one exists; otherwise
      document why none is added.
- [ ] api:compare / test:compare delta non-negative.
