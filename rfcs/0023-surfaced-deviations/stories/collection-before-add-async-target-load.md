---
title: "collection-before-add-async-target-load"
status: in-progress
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3651
claim: "2026-06-19T15:24:27Z"
assignee: "collection-before-add-async-target-load"
blocked-by: null
---

## Context

Tracked-pending-convergence deviation surfaced and documented by story
`before-add-callback-sync-target-load` (RFC 0023). See
`packages/website/docs/guides/activerecord-rails-deviations.md` §11
("Collection `before_add` cannot force-load the target") and
`packages/activerecord/src/nested-attributes-with-callbacks.test.ts`
(`birdsWithAddLoad`).

Rails fires collection `before_add` from the **synchronous**
`CollectionAssociation#add_to_target`, and because Rails' collection load is
synchronous, a `before_add` proc can force-load the target via `.to_a` and
observe it loaded before the proc returns. In trails the callback dispatch
path is synchronous (`addToTarget` → `replaceOnTarget` → `callback` in
`packages/activerecord/src/associations/collection-association.ts`, with
`build()` a sync Rails-parity public API) but the collection load
(`loadTarget` / `toArray`) is async, so a sync proc cannot `await` the load.
The port can only fire-and-forget (`void p.birdsWithAddLoad.toArray()`).

Observable parity already holds (the record lands in the in-memory target via
the sync build path), so this is purely a callback-semantics deviation: a
`before_add` proc that depends on the target being loaded _as a side effect of
the callback itself_ would not see it loaded in trails.

## Acceptance criteria

- Thread async through the collection add-callback path (`build` /
  `addToTarget` / `replaceOnTarget` / `callback`) so a `before_add` proc can
  be `async` and is awaited before the add completes, OR conclude with
  evidence that the sync `build()` Rails-parity surface makes this infeasible
  and re-document accordingly.
- If converging, update `nested-attributes-with-callbacks.test.ts`'s
  `birdsWithAddLoad` proc to `await`/load faithfully rather than `void`, and
  remove the deviation note from §11 of the deviations guide.
- No regression in test:compare for `nested_attributes_with_callbacks_test.rb`.
