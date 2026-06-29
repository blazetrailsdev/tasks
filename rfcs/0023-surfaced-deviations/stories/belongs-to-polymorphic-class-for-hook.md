---
title: "belongs_to polymorphic: polymorphic_name / polymorphic_class_for hooks not implemented"
status: in-progress
updated: 2026-06-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 4268
claim: "2026-06-29T12:46:10Z"
assignee: "belongs-to-polymorphic-class-for-hook"
blocked-by: null
---

## Context

`vendor/rails/activerecord/test/cases/associations/belongs_to_associations_test.rb` — `test_polymorphic_with_custom_name_counter_cache` and `test_polymorphic_with_custom_name_touch_old_belongs_to_model`: Rails supports `polymorphic_name` on a model class (returns a custom type string stored in `_type` column) and `polymorphic_class_for` on the association owner (maps the stored type string back to a class for counter-cache and touch updates). Trails has no equivalent of these hooks. Surfaced in PR #4209 (both tests marked `.todo`).

Trails source: `packages/activerecord/src/associations.ts` — `resolveAssocClass()` resolves the polymorphic target by looking up the `_type` value directly in the model registry; there is no `polymorphicClassFor` hook to customize this lookup.

## Acceptance criteria

- `Base.polymorphicName()` static method is honored when storing the polymorphic type string.
- `Association.polymorphicClassFor(typeName)` hook is supported to resolve the class for a given type string during counter-cache/touch updates.
- Both `polymorphic with custom name counter cache` and `polymorphic with custom name touch old belongs to model` pass (un-todo).
