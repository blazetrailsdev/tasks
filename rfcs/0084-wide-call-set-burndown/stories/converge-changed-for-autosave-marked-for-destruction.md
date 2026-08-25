---
title: "converge-changed-for-autosave-marked-for-destruction"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6403
claim: "2026-08-12T09:25:59Z"
assignee: "converge-changed-for-autosave-marked-for-destruction"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the re-measure in `extractor-predicate-and-closure-order-artifacts`
(RFC 0084) and confirmed genuine port divergence, not extractor noise. That
story may not edit association source, so the fix is filed here.

Rails `autosave_association.rb:275-277`:

    def changed_for_autosave?
      new_record? || has_changes_to_save? || marked_for_destruction? || nested_records_changed_for_autosave?
    end

trails `packages/activerecord/src/autosave-association.ts#changedForAutosave`:

    return (
      this.isNewRecord() ||
      !!this.hasChangesToSave ||
      !!this.changed ||
      !!this[MARKED_FOR_DESTRUCTION] ||
      isNestedRecordsChangedForAutosave.call(this)
    );

Three divergences in four lines:

1. **The ported `marked_for_destruction?` is bypassed.** `isMarkedForDestruction`
   (autosave-association.ts:170) IS that port, and seven other call sites in the
   same file use it; this body reads the private
   `Symbol.for("blazetrails.markedForDestruction")` slot directly instead. That
   is the baselined row
   `autosave-association.ts | changed_for_autosave? | marked_for_destruction? → isMarkedForDestruction|markedForDestruction`
   (and its twin attributed to `base.ts` through the include).
2. **An extra disjunct.** `!!this.changed` has no counterpart in Rails' four
   terms — `has_changes_to_save?` is the whole "is it dirty" question. Check
   what it was compensating for before removing it.
3. **A duplicate port.** `isChangedForAutosave` exists alongside
   `changedForAutosave` and just forwards to it. One Rails method is one TS
   method (CLAUDE.md, "Decomposition"), so one of the two spellings goes, with
   its callers updated.

## Acceptance criteria

1. The body calls the ported `marked_for_destruction?` rather than reading the
   symbol slot, with Rails' four terms in Rails' order.
2. `!!this.changed` is removed, or kept with the language shortcoming named at
   the call site and a test that fails without it.
3. One port of `changed_for_autosave?` remains; `pnpm parity:api:extra --package
activerecord` does not gain a row.
4. BOTH baselined rows (`autosave-association.ts` and `base.ts`) are deleted
   from `call-mismatches-exclude/` by hand (only-shrink), and the re-measure
   reports no rows added.
5. Regression coverage fails on the pre-fix baseline.
