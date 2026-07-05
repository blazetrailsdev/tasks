---
title: "OO replaceOnTarget: model @replaced_or_added_targets dedup, @_was_loaded append gate, and conditional @association_ids reset"
status: ready
updated: 2026-07-05
rfc: "0033-standalone-associations-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The OO `replaceOnTarget` port (packages/activerecord/src/associations/collection-association.ts,
now split into `beginReplaceOnTarget`/`finishReplaceOnTarget`) is a simplified
version of Rails' `replace_on_target`
(vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:457-483).
Three Rails behaviors are not modelled (all pre-existing, out of scope for
PR #4619 which only moved the insert inside the funnel):

1. **`@replaced_or_added_targets` dedup tracking** — Rails tracks added/replaced
   records in `@replaced_or_added_targets` and recomputes the target index after
   `yield` (`if !index && @replaced_or_added_targets.include?(record)`), and only
   registers `@replaced_or_added_targets << record if inversing || index ||
record.new_record?`. trails' OO `replaceOnTarget` has no equivalent set (only
   the runtime `CollectionProxy` models `_replacedOrAddedTargets`), so a
   persisted record re-added under `replace` can be indexed differently.

2. **`@_was_loaded` append gate** — Rails gates the append branch on
   `@_was_loaded || !loaded?` (line 478) and juggles `@_was_loaded` around the
   `yield` (set true before, reset to `loaded?` via `insert_record`'s inner
   block). trails' `finishReplaceOnTarget` appends unconditionally.

3. **Conditional `@association_ids` reset** — Rails resets `@association_ids = nil`
   only on the append branch (line 479), immediately before `target << record`;
   trails resets `_associationIds` unconditionally in `beginReplaceOnTarget`
   (before the push, on both replace and append paths).

Surfaced in review of PR #4619 (oo-concatrecords-insert-inside-add-to-target).

## Acceptance criteria

- Audit each of the three divergences against Rails and either converge the OO
  `beginReplaceOnTarget`/`finishReplaceOnTarget` to match `replace_on_target`, or
  document why the simplification is behavior-equivalent for the OO call sites
  (build/replace/concat).
- Keep the sync/async split and existing has-many/through/habtm suites green.
- Coordinate with `replace-on-target-add-regardless-of-save-result` (the
  save-result gate is a fourth facet of the same method).
