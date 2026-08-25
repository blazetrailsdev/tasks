---
title: "replace-on-target-inversing-parameter"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6417
claim: "2026-08-12T15:16:49Z"
assignee: "replace-on-target-inversing-parameter"
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

## Also in scope: the decomposition itself (surfaced by #6405)

Rails has ONE method, `replace_on_target` (`collection_association.rb:457-489`).
trails has five functions over the same lines
(`packages/activerecord/src/associations/collection-association.ts`):
`beginReplaceOnTarget:1391`, `finishReplaceOnTarget:1414`, `indexInTarget:1442`,
`replaceOnTarget:1447` and `replaceOnTargetAsync:1470`. CLAUDE.md's rule is one
Rails method is one TS method: extract what Rails extracts, inline what Rails
inlines.

Whoever converges the `inversing:` kwarg is already rewriting this cluster, so
fold the decomposition in rather than adding the parameter to five signatures.
The `@_was_loaded` guard added by #6401 and the yield-point plumbing from #6405
both land in `finishReplaceOnTarget`'s append arm
(`elsif @_was_loaded || !loaded?`, `:480`) — keep
`packages/activerecord/src/persistence-save-block.trails.test.ts`'s
duplicate-append test green through the rewrite; it fails the moment that arm
or the yield ordering regresses.

`indexInTarget` deserves a decision rather than a straight inline: it exists
because Ruby's `@target.index(record)` uses `Core#==` while JS `indexOf` uses
reference identity, which is a genuine language gap — but Rails still spells it
as one call inside the method.

## Acceptance criteria

1. `replaceOnTarget` / `replaceOnTargetAsync` / `beginReplaceOnTarget` /
   `finishReplaceOnTarget` carry Rails' `inversing` parameter with Rails'
   default (`false`), and the set-add guard is
   `inversing || index || record.new_record?`.
2. The `target=` / `setInverseInstance` caller passes `inversing: true`, as
   Rails does at `collection_association.rb:294`.
3. Regression coverage: a persisted record added through the inversing path and
   then replaced does not double-append; the test fails on the pre-fix tree.
