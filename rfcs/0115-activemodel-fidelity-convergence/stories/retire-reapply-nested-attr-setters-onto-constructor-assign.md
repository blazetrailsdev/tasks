---
title: "Retire _reapplyNestedAttrSetters and let the Base constructor assign nested attributes on one pass"
status: claimed
updated: 2026-08-21
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: "2026-08-21T13:50:33Z"
assignee: "retire-collection-proxy-append-bang-and-wire-inverse-target"
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveRecord::Base#initialize` (core.rb:390-400) routes the attribute
hash straight through `assign_attributes`, so a `#{name}_attributes=` key is
dispatched by `_assign_attribute`'s `public_send(setter, v)`
(activemodel/lib/active_model/attribute_assignment.rb:68) exactly like any other
key. There is no second pass.

trails' `Base` constructor instead writes the hash with `writeAttribute` and
then re-dispatches the nested-attribute keys afterwards, through the
trails-invented `_reapplyNestedAttrSetters`
(`packages/activerecord/src/persistence.ts:903`, called from
`packages/activerecord/src/base.ts:3307`). It walks a `_nestedAttributeSetterKeys`
registry maintained by `generateAssociationWriter`
(`packages/activerecord/src/nested-attributes.ts`) — a registry that exists only
to serve this second pass. Rails has neither the method nor the registry, and
`persistence.rb` has no counterpart for either.

PR #6801 removed the reason it was unreachable any other way: the nested writer
is now installed under Ruby's own method name, the string key
`"#{name}Attributes="`, alongside the `set#{Name}Attributes` spelling, so
`public_send(setter, v)` reaches it and the promise it owes survives the send.
The constructor can therefore take Rails' single path.

## Converged shape

The `Base` constructor assigns through `_assignAttributes` (which already sends
`_assign_attribute` to `this` after #6801), so nested-attribute keys dispatch
inline on the first and only pass, as they do in Rails. `_reapplyNestedAttrSetters`
and the `_nestedAttributeSetterKeys` registry that feeds it are deleted, along
with the `create`/`createBang` call sites that drive the second pass.

Watch the ordering Rails gets for free: `_assign_attributes`
(activerecord/lib/active_record/attribute_assignment.rb:6-23) buckets Hash
values out of the scalar loop and assigns them only after it (:21), so a nested
writer's `reject_if` and the built record's callbacks see an owner whose own
columns are already set — which is the invariant the current second pass is
approximating.

## Acceptance criteria

- `persistence.ts` no longer defines or exports `_reapplyNestedAttrSetters`, and
  `nested-attributes.ts` no longer maintains `_nestedAttributeSetterKeys`.
- `Model.new({ commentsAttributes: [...] })` and `Model.create({...})` queue
  nested attributes on the single constructor pass.
- `nested-attributes*.test.ts`, `nested-attributes-with-callbacks.test.ts` and
  `has-one-associations.test.ts` stay green.
- `pnpm parity:api:extra --package activerecord` loses two novel names.
