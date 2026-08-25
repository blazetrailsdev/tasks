---
title: "Drop CollectionProxy's duplicate persisted-owner guard now that _createRecord raises it"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6423
claim: "2026-08-12T15:56:54Z"
assignee: "converge-mark-for-destruction-slot-writes"
blocked-by: null
closed-reason: null
---

## Context

Rails' `CollectionProxy#create` / `create!` (collection_proxy.rb:298-321) are
one line each — `@association.create(attributes, &block)` — with no owner
guard. The persisted-owner check lives solely in
`CollectionAssociation#_create_record`
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:355-357`):

```ruby
unless owner.persisted?
  raise ActiveRecord::RecordNotSaved.new("You cannot call create unless the parent is saved", owner)
end
```

trails carries it twice. `_ensurePersistedOwnerForCreate`
(`packages/activerecord/src/associations/collection-proxy.ts`) raises the same
`RecordNotSaved` from the proxy before dispatching, and since PR #6410 ported
`_createRecord`, the association raises it again on the non-through arm. The
duplicate is invisible today (same error, same message, and the proxy's copy
fires first), but it is a second guard Rails does not have, and it means the
non-through path's Rails-sited guard is dead code the tests never reach.

The proxy guard cannot simply be deleted: the through and singular arms
(`_createThrough`, `_createSingular`) still rely on it, and they do not route
through `_createRecord`.

## Converged shape

Once the through/singular create arms route through
`CollectionAssociation#_createRecord` (see
`route-through-create-via-create-record`), drop
`_ensurePersistedOwnerForCreate` entirely so the guard exists only at Rails'
site. If those arms land separately, narrow the proxy guard to them in the
interim rather than running it ahead of the non-through dispatch.

## Acceptance criteria

- [ ] `CollectionProxy#create` / `createBang` do not raise the owner guard
      themselves on any arm that reaches `_createRecord`.
- [ ] `_ensurePersistedOwnerForCreate` is deleted, or scoped to the arms that
      genuinely do not reach the ported guard, with the reason at the call site.
- [ ] `create with bang on has many when parent is new raises` and the
      surrounding has-many suites stay green — the error class, message and
      `record` payload are unchanged.
