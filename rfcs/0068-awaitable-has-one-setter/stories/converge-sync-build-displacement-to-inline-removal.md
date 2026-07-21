---
title: "Converge the synchronous build displacement path to Rails' inline remove_target!"
status: draft
updated: 2026-07-21
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails removes a displaced `has_one` **inline at assignment**: `set_new_record`
-> `replace(record, false)` -> `remove_target!`, including the persisted
nullify `target.save`
(`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:87-93,95-115`).

Trails cannot, on the _synchronous_ build path. `setNewRecord`
(`packages/activerecord/src/associations/has-one-association.ts`) does only the
in-memory nullify and queues the record on `_displacedRecords`; the owner's
`autosaveHasOne` drain removes it at `save()` time. The deferral IS the
deviation — the same class of deviation RFC 0068 retired for the `=` setter.

The awaitable `build#{Name}` / `create#{Name}` accessors already converge (they
remove inline via `detachDisplacedTarget`,
`packages/activerecord/src/associations/builder/has-one.ts:78-80,91-93`). The
gap is `assoc.build()` called directly — which is what nested attributes does
(`packages/activerecord/src/nested-attributes.ts:772`), reached from the
synchronous `record.shipAttributes = {...}` assignment.

PR #4983 attempted to delete this machinery per
`retire-has-one-displacement-machinery` and had to restore it: removing the
queue leaves the displaced row attached in the DB. Verified by baselining
against `main`. Guard test added there:
`packages/activerecord/src/associations/has-one-sync-build-displacement.trails.test.ts`.

That story's acceptance criteria are unsatisfiable as written (it also assumed
`queueWrite` was dead — it is the sync writer dispatch RFC 0068 created, with
live callers in mass-assignment and the through-inverse builders). This story
is the real remaining scope.

## Acceptance criteria

- [ ] The synchronous `assoc.build()` path removes the displaced record inline,
      matching Rails, OR nested attributes routes through an awaitable
      equivalent so the removal is awaited at assignment.
- [ ] `_displacedRecords` + the `autosaveHasOne` drain are deleted only once the
      above holds; `git grep` for them returns 0 hits in
      `packages/activerecord/src`.
- [ ] `has-one-sync-build-displacement.trails.test.ts` stays green (it must fail
      if the displaced row is left attached — verify by baselining).
- [ ] `queueWrite` is NOT touched: it is the RFC 0068 sync writer dispatch, not
      displacement machinery.
- [ ] `has_one` / autosave / nested-attributes suites green.

## Notes

Likely interacts with
`has-one-displaced-record-removed-twice-on-awaited-build` (the awaited-build
double-enqueue) — sequence them, or fix both in one pass since they touch the
same enqueue.
