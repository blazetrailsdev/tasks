---
title: "activerecord: AssociationReflection#compute_class resolves through active_record.compute_type"
status: ready
updated: 2026-10-05
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `activerecord-converge-invented-control-flow-arms-associations-part-2` (RFC 0178).

Rails' `AssociationReflection#compute_class`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/reflection.rb:490-511`) resolves the class
through the owning model: `klass = active_record.send(:compute_type, name)`. That is why
`Builder::HasAndBelongsToMany#through_model`'s anonymous join model overrides `compute_type` to
delegate to `left_model` (`associations/builder/has_and_belongs_to_many.rb:31-33`) and sets nothing
else about namespacing.

trails' `computeClass` (`packages/activerecord/src/reflection.ts:967-1015`) does not call
`activeRecord.computeType`; it walks `activeRecordRegistryName()` / `moduleName` segments itself.
So the join model's `computeType` override is never consulted, and
`packages/activerecord/src/associations/builder/has-and-belongs-to-many.ts#throughModel` has to copy
`joinModel.moduleName = lhsModel.moduleName` (a statement Rails lacks) or
`has and belongs to many in a namespaced model pointing to a namespaced model` reds with
`Missing model class Article for the HABTM_Articles#article association`.

## Acceptance criteria

- [ ] `computeClass` is `this.activeRecord.computeType(name)` inside Rails' `rescue NameError` arm.
- [ ] `throughModel` no longer assigns `joinModel.moduleName`.
- [ ] `has-and-belongs-to-many-associations.test.ts` passes.
