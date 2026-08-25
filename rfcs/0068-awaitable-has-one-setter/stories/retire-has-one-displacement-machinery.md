---
title: "Retire queueWrite / _displacedRecords / removeDisplaced and the autosave drain"
status: done
updated: 2026-07-21
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: ["has-one-setter-throws-on-persisted-owner"]
deps-rfc: []
est-loc: 350
priority: 12
pr: 4983
claim: "2026-07-20T01:31:13Z"
assignee: "retire-has-one-displacement-machinery"
blocked-by: null
---

## Context

With the persisted-owner `=` setter throwing (previous story), no caller can
reach the deferred-displacement machinery, and it is removed wholesale:

- `packages/activerecord/src/associations/has-one-association.ts` —
  `_displacedRecords` (:37), `_removeDisplacedFromDb` (:48), their `reset()`
  clearing (:54-58), `queueWrite` (:70-107), `removeDisplaced` (:195-226),
  `removeOne` (:234-242), and the `_displacedRecords` push in
  `setNewRecord` (:551-566 — keep the Rails-faithful in-memory nullify half;
  the DB half now runs via the create/build accessors'
  `detachDisplacedTarget`, which STAYS: it is the port of `remove_target!`
  inside `replace`).
- `packages/activerecord/src/autosave-association.ts:500-506` — the
  `removeDisplaced` drain in `autosaveHasOne`.
- The flush-before-X patches from the superseded cluster: the
  `_createRecord` flush (#4901) and the `persistImmediate` flush (#4908),
  plus any sibling flush points landed since — sweep by grep, not memory.

Rails reference: `HasOneAssociation#replace`
(`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:59-84`)
has exactly one path; `save_has_one_association` (autosave) has no
displacement drain. End state matches file-for-file.

This story also absorbs 0005's draft
`has-one-replace-missing-load-target-early-return`: Rails' `return target
unless load_target || record` (`has_one_association.rb:61`) was dropped
because the sync `queueWrite` could not await the load —
`_removeDisplacedFromDb` (and the through's `mightNeedDelete`) are its
stand-ins, as that story observes. With the sync persisted-owner path gone,
port the early return into the converged `replace`: `writeImmediate` already
runs the leading `loadTarget`, and `replace(null)` on a never-loaded
association must no longer mark it loaded via `loadedBang`.

## Acceptance criteria

- [ ] `git grep -nE "queueWrite|_displacedRecords|_removeDisplacedFromDb|removeDisplaced" packages/activerecord/src`
      returns 0 hits (docs/error-message prose excluded).
- [ ] `autosaveHasOne` contains no displacement drain; only the Rails
      save-the-child half remains.
- [ ] Regression tests from the superseded cluster
      (`has-one-displaced-record-multi-slot.trails.test.ts`, the
      #4901/#4908-era trails-only window tests) are re-expressed against the
      new surface or deleted with rationale — no order-dependent two-row
      assertions remain.
- [ ] Rails' `replace` early return (`has_one_association.rb:61`) ported:
      `replace(null)` on a never-loaded association returns without marking
      it loaded, and the `record?.hasChangesToSave` guard stops carrying the
      un-ported clause (see 0005's
      `has-one-replace-missing-load-target-early-return`, which this
      supersedes).
- [ ] 0005's `has-one-replace-missing-load-target-early-return` closed via
      `pnpm tasks close` with a superseded-by reason naming this story.
- [ ] has_one / autosave / nested-attributes suites green.

## Verification

`git grep -cE "queueWrite|_displacedRecords|_removeDisplacedFromDb|removeDisplaced" packages/activerecord/src` → no matches;
`pnpm vitest run packages/activerecord/src/associations/has-one-associations.test.ts packages/activerecord/src/autosave-association.test.ts`
