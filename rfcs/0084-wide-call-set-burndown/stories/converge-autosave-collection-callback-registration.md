---
title: "Drop the invented autosave:false gate from the collection autosave callback registrations"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6409
claim: "2026-08-12T12:26:11Z"
assignee: "call-args-ar-extra-argument-rest-2"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging the has_one raise site in
`converge-autosave-has-one-rollback-raise` (PR #6393). The has_one arm of
`addAutosaveAssociationCallbacks` now registers plainly, matching Rails; the
collection arm still carries an invented runtime gate.

Rails `add_autosave_association_callbacks`
(`vendor/rails/activerecord/lib/active_record/autosave_association.rb:192-198`):

    if reflection.collection?
      around_save :around_save_collection_association

      define_non_cyclic_method(save_method) { save_collection_association(reflection) }
      # Doesn't use after_save as that would save associations added in after_create/after_update twice
      after_create save_method
      after_update save_method

The registration is unconditional. trails
(`packages/activerecord/src/autosave-association.ts`, `addAutosaveAssociationCallbacks`,
`isCollection` branch) instead registers lambdas that re-resolve the reflection
off `record.constructor._associations` at callback time and early-return when
`assocDef?.options?.autosave === false`:

    afterCreate(model, async (record: any) => {
      const assocDef = record.constructor._associations?.find((a: any) => a.name === collectionName);
      if (assocDef?.options?.autosave === false) return;
      await record[saveMethod]();
    });

Rails has no such gate here — the `autosave != false` decision lives inside
`save_collection_association` itself (`autosave_association.rb:429-431`,
`if autosave != false && ...`), which is exactly the argument already written
into the has_one arm's comment in the same function.

## Acceptance criteria

1. The collection `afterCreate`/`afterUpdate` registrations call the save method
   with no reflection re-lookup and no `autosave === false` early return,
   matching `autosave_association.rb:197-198`.
2. Any `autosave: false` opt-out behavior that the gate was covering is enforced
   inside `saveCollectionAssociation` where Rails enforces it.
3. `autosave-association.test.ts` and `src/associations/**` stay green,
   including the `autosave: false` collection tests.
4. `pnpm parity:api:calls` / `:args` non-regressive.
