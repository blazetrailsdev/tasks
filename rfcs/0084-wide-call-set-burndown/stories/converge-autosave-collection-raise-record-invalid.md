---
title: "Raise RecordInvalid(association.owner) inside saveCollectionAssociation instead of returning false"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: 6392
claim: "2026-08-12T01:06:01Z"
assignee: "converge-associated-records-custom-validation-context"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6385 (`converge-autosave-belongs-to-and-insert-helpers`) while
inlining the collection insert dispatch into `saveCollectionAssociation`.

Rails' per-record loop ends with a raise
(`vendor/rails/activerecord/lib/active_record/autosave_association.rb:460`):

    raise(RecordInvalid.new(association.owner)) unless saved

trails' `packages/activerecord/src/autosave-association.ts`
`saveCollectionAssociation` instead `return false`s, and the raise is relocated
to the registered `afterCreate`/`afterUpdate` callbacks in
`addAutosaveAssociationCallbacks`, which do
`if ((await record[saveMethod]()) === false) throw new RecordInvalid(record)`.
Two observable differences: the error is constructed from the OWNER RECORD the
callback fired on rather than `association.owner`, and the method's return type
is `Promise<boolean>` where Rails' is the loop's value.

The same relocation shape is in `saveHasOneAssociation` (whose Rails source
raises `ActiveRecord::Rollback` at `:502`, not `RecordInvalid`) — the trails
body returns `!autosave` there and lets the callback translate it.

## Converged shape

Raise `RecordInvalid(association.owner)` at the Rails site inside
`saveCollectionAssociation`, and drop the `=== false` translation from the
`afterCreate`/`afterUpdate` lambdas in `addAutosaveAssociationCallbacks` so the
raise is not double-wrapped. Audit whether `saveHasOneAssociation`'s
`return !autosave` should become a `Rollback` raise in the same pass, or
whether that needs its own story once `Rollback` semantics are settled.

Note the belongs_to arm is separate and already closer to Rails: Rails wraps it
as `throw(:abort) if save_belongs_to_association(reflection) == false`
(`:194`), so the boolean return there is load-bearing and should stay.

## Acceptance criteria

1. `saveCollectionAssociation` raises `RecordInvalid` with `association.owner`
   at `autosave_association.rb:460`'s position, not a `return false`.
2. The `after_create`/`after_update` registrations no longer translate a `false`
   return into a raise for the collection arm.
3. The belongs_to `throw(:abort)`-equivalent boolean path is unchanged.
4. `autosave-association.test.ts` (201) and `src/associations/**` stay green,
   including the tests asserting `owner.save()` returns false / raises.
5. `pnpm parity:api:calls` / `:args` non-regressive.
