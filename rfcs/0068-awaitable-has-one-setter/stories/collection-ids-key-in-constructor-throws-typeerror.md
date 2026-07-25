---
title: "collection-ids-key-in-constructor-throws-typeerror"
status: done
updated: 2026-07-25
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5296
claim: "2026-07-25T03:34:52Z"
assignee: "collection-ids-key-in-constructor-throws-typeerror"
blocked-by: null
closed-reason: null
---

## Context

`new Author({ postIds: [...] })` (and therefore `Author.create({ postIds: [...] })`)
dies with an opaque `TypeError: Cannot read properties of undefined (reading 'get')`
instead of reaching the association writer at all. Pre-existing; found while
shipping the ids= throw (#5292), which is why that PR's coverage stops at
`assignAttributes` rather than the constructor.

Cause: `_extractAssociationAttrs`
(`packages/activerecord/src/base.ts:690-718`) pulls only keys that match an
association **name** out of `attrs` so `_dispatchAssociationAttrs`
(`base.ts:819-830`) can assign them _after_ `super()` — i.e. after the
`_associationInstances` class field
(`base.ts:3024`) is initialized. A `#{singular}Ids` key matches no association
name, so it stays in `rest`, is assigned inside `super()` by
`activemodel/src/attribute-assignment.ts#_assignAttribute` → the ids setter
(`associations/builder/collection-association.ts`) → `association(name)`
(`associations/instance-methods.ts:123`), where `this._associationInstances` is
still `undefined`.

Rails has no such split — `Author.new(post_ids: [...])` runs `ids_writer`
normally (`collection_association.rb:61-83`).

The same hazard applies to any other generated writer that reaches
`this.association(...)` from inside `super()`.

## Acceptance criteria

- [ ] `new Author({ postIds: [...] })` raises `CollectionIdsAssignmentError`
      (wrapped by `_assign_attributes`' rescue as `AttributeAssignmentError`),
      not `TypeError`.
- [ ] The fix is in the constructor split, not in the setter: either
      `_extractAssociationAttrs` also defers `#{singular}Ids` keys (dispatching
      them through the setter, NOT `assignAssociationIfMatch`, which matches on
      association name and would silently drop the value), or
      `_associationInstances` is initialized before attribute assignment runs.
- [ ] A key named `#{singular}Ids` that is a real column on a model which also
      declares that association is not silently rerouted.
- [ ] Regression test fails on baseline with the `TypeError`.
- [ ] No test renames.
