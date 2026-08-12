---
title: "converge-collection-association-reset-concat-empty"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6401
claim: "2026-08-12T03:46:01Z"
assignee: "converge-collection-association-reset-concat-empty"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the re-measure in `extractor-predicate-and-closure-order-artifacts`
(RFC 0084), which fixed the tooling artifacts in
`packages/activerecord/src/associations/collection-association.ts`'s call rows
and confirmed the following three are genuine port divergence, not extractor
noise. That story may not edit association source, so the fixes are filed here.

**1. `reset` drops a whole assignment.** Rails
`collection_association.rb:87-92`:

    def reset
      super
      @target = []
      @replaced_or_added_targets = Set.new.compare_by_identity
      @association_ids = nil
    end

trails `collection-association.ts#reset` sets `target` and `_associationIds` and
never resets `_replacedOrAddedTargets`. Baselined as
`collection-association.ts | reset | new → constructor` — the `new` row IS the
missing `Set.new.compare_by_identity`.

**2. `concat_records` drops `@_was_loaded = loaded?`.** Rails
`collection_association.rb:438-454` passes a block to `insert_record`:

    result &&= insert_record(record, true, raise) { @_was_loaded = loaded? }

trails `concat_records` calls `insertRecord(record, true, raise)` with no block,
so `_wasLoaded` is never captured. Baselined as
`collection-association.ts | concat_records | loaded? → isLoaded|loaded`.

**3. `empty?` is split sync/async and the sync arm drops the query.** Rails
`collection_association.rb:232-238`:

    def empty?
      if loaded? || @association_ids || reflection.has_active_cached_counter?
        size.zero?
      else
        target.empty? && !scope.exists?
      end
    end

trails has `isEmpty()` (which returns `this.target.length === 0`, dropping both
`reflection.has_active_cached_counter?` and `scope.exists?`) and a separate
`isEmptyAsync()` carrying the real else-arm. The comparator pairs Rails against
`isEmpty`, hence
`collection-association.ts | empty? | exists? → isExists|exists`. Whether the
sync arm can carry the query at all is the question to answer first — see the
package's settled sync/async surface idiom before assuming it cannot.

## Acceptance criteria

1. `reset` resets `_replacedOrAddedTargets` to an identity-compared Set, in
   Rails' statement order.
2. `concat_records` captures `_wasLoaded` from `loaded?` at Rails' call site.
3. `empty?`'s divergence is converged or, if the sync/async split is genuinely
   forced, the deviation is justified AT THE CALL SITE with the language
   shortcoming named — not by rewording the baseline row.
4. The three `call-mismatches-exclude/activerecord/associations/collection-association.json`
   rows named above are deleted by hand (only-shrink) as each converges.
5. Regression coverage fails on the pre-fix baseline.
