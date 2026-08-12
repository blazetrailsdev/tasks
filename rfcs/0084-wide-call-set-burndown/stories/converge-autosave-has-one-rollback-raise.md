---
title: "converge-autosave-has-one-rollback-raise"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6393
claim: "2026-08-12T01:25:59Z"
assignee: "converge-autosave-has-one-rollback-raise"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `saveCollectionAssociation`'s raise site in the
`converge-autosave-collection-raise-record-invalid` story (PR for
`converge-associated-records-custom-validation-context`). That story converged
the collection arm — the loop now does
`throw new RecordInvalid(association.owner)` at
`vendor/rails/activerecord/lib/active_record/autosave_association.rb:460` — and
the `afterCreate`/`afterUpdate` registrations for collections no longer
translate a `false` return into a raise.

The has_one arm still carries the relocated shape. Rails
(`autosave_association.rb:500-503`):

    saved = record.save(validate: !autosave)
    raise ActiveRecord::Rollback if !saved && autosave
    saved

trails' `saveHasOneAssociation` in
`packages/activerecord/src/autosave-association.ts` returns `!autosave` there
and the registered `afterCreate`/`afterUpdate` lambdas in
`addAutosaveAssociationCallbacks` do
`if ((await record[saveMethod]()) === false) throw new RecordInvalid(record)` —
a different error class raised at a different site.

Converging needs `ActiveRecord::Rollback` semantics to be settled in trails
(the raise must abort the enclosing transaction without escaping `save`), which
is why it was left out of the collection PR rather than done in the same pass.

## Acceptance criteria

1. `saveHasOneAssociation` raises `Rollback` at `autosave_association.rb:502`'s
   position when `!saved && autosave`, and returns `saved` otherwise.
2. The has_one `afterCreate`/`afterUpdate` registrations no longer translate a
   `false` return into a `RecordInvalid`.
3. `autosave-association.test.ts` and `src/associations/**` stay green,
   including tests asserting `owner.save()` returns false.
4. `pnpm parity:api:calls` / `:args` non-regressive.
