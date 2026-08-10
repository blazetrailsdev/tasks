---
title: "Constructor/create nested-attribute dispatch moves off the prototype-descriptor walk"
status: done
updated: 2026-08-07
rfc: "0087-awaitable-association-writers-only"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6162
claim: "2026-08-07T01:08:29Z"
assignee: "check-pending-migrations-is-a-no-op-stub"
blocked-by: null
closed-reason: null
---

## Context

`migrate-nested-attributes-assignments-to-awaitable-writer` (PR #6159) removed
every _test-authored_ caller of the generated `#{name}Attributes=` property
setter. One production caller remains, and it is invisible to that migration
because it never names the setter — it finds it by descriptor walk:

- `packages/activerecord/src/persistence.ts:1046-1054` — `findPrototypeSetter`
  walks the prototype chain for `Object.getOwnPropertyDescriptor(proto, key).set`
  and returns it.
- `packages/activerecord/src/persistence.ts:1064-1080` —
  `_reapplyNestedAttrSetters` calls it for every key in
  `_nestedAttributeSetterKeys`, so `Model.create({ shipAttributes: {...} })` and
  `new Model({ shipAttributes: {...} })` dispatch through the property setter's
  descriptor.
- `packages/activerecord/src/base.ts:3268-3273` — the constructor call site.

`delete-nested-attributes-deferred-displacement` deletes the
`Object.defineProperty(modelClass.prototype, attrName, { set })` arm in
`generateAssociationWriter` (`nested-attributes.ts:575-580`). The moment it
does, `findPrototypeSetter` returns `undefined` for every nested-attributes key
and `_reapplyNestedAttrSetters`'s `if (setter)` guard silently skips it —
constructor-time nested attributes stop being assigned at all, with no error.
This must land before, or inside, that deletion.

The descriptor walk is also a trails invention on its own terms. Rails dispatches
by name: `_assign_attributes` does
`_assign_attribute(k, v)` → `public_send("#{k}=", value)`
(`vendor/rails/activemodel/lib/active_model/attribute_assignment.rb:35-48`), and
`nested_attributes.rb`'s generated writer is an ordinary method reached that way
(`vendor/rails/activerecord/lib/active_record/nested_attributes.rb:582-591`).
There is no descriptor introspection in Rails, and `findPrototypeSetter`'s own
JSDoc concedes it exists for the store-accessor case rather than for Rails
parity.

## Converged shape

`_reapplyNestedAttrSetters` awaits the Rails-named awaitable writer by name —
`record[`set${camelize(k, true)}`](attrs[k])` — instead of hunting a descriptor,
matching Rails' `public_send` dispatch. Since the writer is async, the
`create`/`createBang` call sites already `await`; the `base.ts` constructor call
site is the one that needs the settled `setX()` treatment (a constructor cannot
await, so construction-time nested attributes are queued and drained where the
existing code drains them — see `awaitPendingNestedReaderLoads` in
`nested-attributes.ts:184`).

Keep `findPrototypeSetter` only if the store-accessor path still needs it; if
nothing else calls it, delete it with the setter.

## Acceptance criteria

- [ ] `_reapplyNestedAttrSetters` dispatches nested-attribute keys by Rails name,
      not by prototype descriptor.
- [ ] `Model.create({ shipAttributes: {...} })` and
      `new Model({ shipAttributes: {...} })` still assign nested attributes with
      the property setter deleted — covered by a test that fails on a baseline
      where the setter arm of `generateAssociationWriter` is removed.
- [ ] `findPrototypeSetter` is deleted, or its remaining caller is cited at the
      call site.
- [ ] `pnpm parity:api:extra --package activerecord` delta non-negative.
