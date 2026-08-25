---
title: "Add the custom_validation_context? arm to associatedRecordsToValidateOrSave and drop the caller workaround"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6392
claim: "2026-08-12T01:06:01Z"
assignee: "converge-associated-records-custom-validation-context"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6385 (`converge-autosave-belongs-to-and-insert-helpers`) when
`saveCollectionAssociation` was routed through the ported
`associatedRecordsToValidateOrSave` helper instead of a reimplemented inline
filter.

Rails `associated_records_to_validate_or_save`
(`vendor/rails/activerecord/lib/active_record/autosave_association.rb:298-305`):

    def associated_records_to_validate_or_save(association, new_record, autosave)
      if new_record || custom_validation_context?
        association && association.target
      elsif autosave
        association.target.find_all(&:changed_for_autosave?)
      else
        association.target.find_all(&:new_record?)
      end
    end

trails' port in `packages/activerecord/src/autosave-association.ts` drops the
`|| custom_validation_context?` arm of the first branch entirely, so under a
custom validation context a persisted, unchanged child is filtered out where
Rails returns the whole target.

`validateCollectionAssociation` in the same file already works around the gap:
it computes the custom-context case itself (`const records = customCtx ? ...
: associatedRecordsToValidateOrSave(...)`) with an inline `Array.wrap`-shaped
ternary, rather than the helper handling it. `saveCollectionAssociation`, which
also calls the helper (Rails `:437`), has no such workaround and so silently
diverges on the same input.

## Converged shape

Add the `|| custom_validation_context?` arm to
`associatedRecordsToValidateOrSave` — it already reads `customValidationContext`
elsewhere in the file — and delete the compensating ternary from
`validateCollectionAssociation` so both call sites go through one
implementation, as Rails does.

## Acceptance criteria

1. `associatedRecordsToValidateOrSave` implements all three Rails branches
   including `custom_validation_context?`.
2. `validateCollectionAssociation`'s inline custom-context ternary is gone; it
   calls the helper unconditionally.
3. A test covers a custom validation context over a collection with an
   unchanged persisted child (Rails' `validates_associated` + `on:` context
   cases in `autosave_association_test.rb`).
4. `autosave-association.test.ts` and `nested-attributes*` stay green.
5. `pnpm parity:api:calls` non-regressive.
