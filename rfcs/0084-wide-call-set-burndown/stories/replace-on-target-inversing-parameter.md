---
title: "replace-on-target-inversing-parameter"
status: ready
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `CollectionAssociation#replace_on_target(record, skip_callbacks,
replace:, inversing: false)`
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:457`)
takes an `inversing:` kwarg, passed `true` from the `target=` /
`set_inverse_instance` path (`collection_association.rb:294`). It is read at
`:476`:

    @replaced_or_added_targets << record if inversing || index || record.new_record?

trails' `replaceOnTarget` / `beginReplaceOnTarget` / `finishReplaceOnTarget`
(`packages/activerecord/src/associations/collection-association.ts:1426-1522`)
have no `inversing` parameter; `finishReplaceOnTarget` uses only
`at !== -1 || record.isNewRecord()`. A persisted record added through the
inversing path therefore never enters `@replaced_or_added_targets`, so a later
`replace_on_target` for the same record misses the index lookup at `:458` and
appends a duplicate instead of replacing in place.

Surfaced during review of PR #6401
(`converge-collection-association-reset-concat-empty`); predates that PR and
was out of its scope.

## Acceptance criteria

1. `replaceOnTarget` / `replaceOnTargetAsync` / `beginReplaceOnTarget` /
   `finishReplaceOnTarget` carry Rails' `inversing` parameter with Rails'
   default (`false`), and the set-add guard is
   `inversing || index || record.new_record?`.
2. The `target=` / `setInverseInstance` caller passes `inversing: true`, as
   Rails does at `collection_association.rb:294`.
3. Regression coverage: a persisted record added through the inversing path and
   then replaced does not double-append; the test fails on the pre-fix tree.
