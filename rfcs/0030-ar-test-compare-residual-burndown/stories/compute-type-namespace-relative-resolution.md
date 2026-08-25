---
title: "compute-type-namespace-relative-resolution"
status: done
updated: 2026-06-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3975
claim: "2026-06-23T11:42:40Z"
assignee: "compute-type-namespace-relative-resolution"
blocked-by: null
---

## Context

Follow-up from PR #3874 review (story `store-full-sti-class-name`). That PR made
the _write_ side of STI / polymorphic type columns honor
`storeFullStiClass` / `storeFullClassName`. The _read_ side is still flag-blind:

- `polymorphicClassFor` (`packages/activerecord/src/inheritance.ts:730`) does a
  bare `modelRegistry.get(name)`.
- `stiClassFor` / `findStiClass` are likewise untouched.

Rails' `sti_class_for` / `polymorphic_class_for`
(`activerecord/lib/active_record/inheritance.rb:194-198, 217-221`) branch on the
flag: `constantize` when on, `compute_type` when off. `compute_type` resolves a
demodulized name relative to the model's module nesting, so a model registered
_only_ under its namespaced key still resolves from a stored demodulized type.

In trails this is currently a behavioral no-op because `computeType`
(`inheritance.ts:45`) is itself just `modelRegistry.get` — it does NOT do
Ruby-style namespace-relative constant lookup. So `constantize` and
`compute_type` collapse to the same registry lookup, and branching the read
paths on the flag changes nothing until `computeType` gains namespace-relative
resolution.

The PR #3874 tests pass because the demodulized `"Post"` is also a registered
key (canonical `Post`); a model registered only under a namespaced key with a
demodulized stored type would fail to resolve where Rails succeeds.

## Acceptance criteria

- [x] `computeType` performs Ruby-style namespace-relative constant resolution
      (walk the model's module nesting), mirroring
      `ActiveRecord::Inheritance::ClassMethods#compute_type`.
- [x] `stiClassFor` and `polymorphicClassFor` branch on
      `storeFullStiClass`/`storeFullClassName` (constantize vs compute_type),
      mirroring Rails.
- [x] A test exercises belongs_to -> class resolution of a demodulized
      polymorphic type for a model registered only under its namespaced key.
