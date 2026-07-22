---
title: "replace-mid-load-settarget-raise-with-loaded-flag-yield"
status: draft
updated: 2026-07-22
rfc: "0023-surfaced-deviations"
cluster: null
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

# Replace the mid-load setTarget raise with a Rails-shaped loaded-flag yield

## Context

PRs #5038 (has_many) and #5035 (has_one, belongs_to) made `Association#setTarget`
raise `AssociationTargetReplacedDuringLoad` when a target is replaced while a
load for that association is in flight (`raiseIfLoadInFlight`, guarded by
`_loaderWritebackSuppressed` — packages/activerecord/src/associations/association.ts:206/240;
arming sites: has-many-association.ts:110, has-one-association.ts:450,
belongs-to-association.ts:307). The loader's own writeback is exempt via
`_setTargetFromLoader`.

This raise has no Rails counterpart and is arguably the wrong resolution of the
race:

- **Rails-derivable alternative exists.** In Rails, `target=` is an
  unconditional assign that marks the association loaded
  (vendor/rails/activerecord/lib/active_record/associations/association.rb:102-105),
  and `load_target` only consults `find_target` when the association is not
  already loaded. Extrapolated to trails' async loads, the direct port is:
  the loader's tail writeback checks whether an assignment landed mid-flight
  (loaded flag flipped by `setTarget`) and **yields** — assignment wins,
  silently and deterministically. `AssociationTargetReplacedDuringLoad` is an
  invention; the yield is Rails' own control flow.
- **The raise is nondeterministic.** Whether `setTarget` throws depends on
  whether an unrelated, possibly un-awaited read is in flight — the same app
  code succeeds or raises based on await scheduling. It also penalizes a
  legitimate pattern (fire a load, don't await, assign instead).
- **The yield fixes the original bug fully.** The motivating defect in both
  PRs was the _loader_ clobbering an _assignment_; assignment-wins closes
  exactly that. The raise's only marginal value is flagging accidental
  mid-load assigns, paid for with timing-dependent exceptions.

Caveats for the implementer:

- The raise policy was owner-approved in #5038's review ("pick a winner" was
  rejected there); this story exists because the owner has since reopened the
  question. Confirm before starting.
- **#5009 found holder loaded-ness to be an unsound guard signal** for the
  has_one stale-state guards (SQLite hid the failure; PG/MariaDB surfaced it,
  and the change was reverted). The writeback-yield check here is a different
  use (loader observing its own holder after its own await, not a cross-holder
  staleness probe), but read #5009's revert before relying on the flag.
- Related: 0023-surfaced-deviations/hoist-mid-load-guard-to-doasyncfindtarget-callers
  hoists the arming to `doAsyncFindTarget`'s call sites. If this story lands,
  that arming (and the story) may be obsolete — the yield needs no per-load
  arming at all. Coordinate; do whichever first, but not both blindly.

## Acceptance criteria

- `setTarget` during an in-flight load no longer raises for has_many, has_one,
  has_one :through, belongs_to, or polymorphic belongs_to — the assignment
  stands and the load's writeback yields to it.
- `AssociationTargetReplacedDuringLoad`, `raiseIfLoadInFlight`, and the
  `_loaderWritebackSuppressed` arming are removed (or reduced to whatever the
  yield mechanism still needs).
- The mid-flight-reassignment repro suites
  (has-many-mid-flight-reassignment.trails.test.ts,
  has-one-mid-flight-reassignment.trails.test.ts) are rewritten to assert the
  yield semantics (assignment survives; no exception), each proven non-vacuous
  against a baseline where the writeback clobbers.
- Behavior verified on PG and MySQL, not just SQLite (per the #5009 lesson).
- The deviation comment at each former arming site is replaced by a cite of
  association.rb's loaded-flag guard as the ported source.
