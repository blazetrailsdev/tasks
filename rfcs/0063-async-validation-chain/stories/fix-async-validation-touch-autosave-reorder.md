---
title: "fix-async-validation-touch-autosave-reorder"
status: in-progress
updated: 2026-07-17
rfc: "0063-async-validation-chain"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4919
claim: "2026-07-17T01:41:14Z"
assignee: "fix-async-validation-touch-autosave-reorder"
blocked-by: null
closed-reason: null
---

## Context

Fallout from RFC 0063 `flip-activerecord-isvalid-async` (the AR half merged
into `flip-activemodel-validation-chain-async`). Making `save` genuinely
`await` the validation chain (AR `isValid` now async) reorders the
`belongs_to touch: true` + autosave callbacks relative to the owner's
`changesApplied`, so a foreign-key reassignment loses its `previousChanges`.

Confirmed-red (skipped in that PR, NOT fixed):
`packages/activerecord/src/associations/belongs-to-associations.test.ts`

- `tracking change from one persisted record to another`
- `tracking change from persisted record to new record`

Root cause (traced): at `save`, the newly-awaited validation window lets
the `parent` `belongs_to` holder's target be reloaded to the _stale_ (old)
record. By the time `saveBelongsToAssociation` (before_save) propagates the
FK it reads that stale target and writes the OLD `parent_id` back
(`_autosaveBelongsTo`, autosave-association.ts:~888-891), which
`DirtyTracker.attributeWritten` then treats as a no-op and DELETES the
pending `parent_id` change. The subsequent `changesApplied` (update chain,
callbacks.ts:381) therefore snapshots an empty change set →
`attributePreviouslyChanged("parent_id")` is false.

On `main` (sync `isValid`) `save` does not truly await validation, so the
touch/autosave callbacks run in the original order and `changesApplied`
captures `parent_id` before the stale reload. The fix lives in the
touch / stale-state / association-holder-identity machinery
(`associations/builder/belongs-to.ts` `touchRecord`,
`associations/association.ts` `loadTarget`/`_staleState`), NOT in the
validation flip.

There may be sibling AR failures from the same async-reorder; surface them
via CI's full-suite run and skip-or-fix iteratively under this story.

## Acceptance criteria

- The two skipped belongs-to tests are un-skipped and pass; no test renamed.
- `belongs_to touch: true` FK reassignment records `parent_id` in
  `previousChanges` after save (parity with Rails / pre-flip `main`).
- Any sibling tests skipped for the same async-reorder reason are
  un-skipped and green.
