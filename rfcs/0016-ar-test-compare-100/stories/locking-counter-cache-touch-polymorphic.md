---
title: "F-9e residual: lock_version bump on belongs-to counter cache touch + polymorphic destroy"
status: draft
updated: 2026-06-14
rfc: "0016-ar-test-compare-100"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to `locking-counter-cache-lock-version` (PR #3242, merged), which
implemented the class-level `Locking::Optimistic#update_counters` lock bump and
unskipped the six `OptimisticLockingWithSchemaChangeTest` counter cases.

Two `OptimisticLockingTest` cases remain skipped in
`packages/activerecord/src/locking.test.ts`:

- `counter cache with touch and lock version`
- `polymorphic destroy with dependencies and lock version`

Both exercise Car/Wheel, where `Wheel belongs_to :wheelable, polymorphic: true,
counter_cache: true, touch: :wheels_owned_at`.

The blocker is the belongs-to counter-cache path. `BelongsToAssociation`
(`associations/belongs-to-association.ts` `updateCounters` /
`updateCountersViaScope`) updates the target through the **relation-level**
`scope.updateCounters(..., { touch })`, which bypasses the class-level
`Locking::Optimistic#update_counters` override that bumps `lock_version`.
Separately, the belongs-to touch path runs an optimistic-lock-aware `touch`
that raises `StaleObjectError: Car`.

Rails routes belongs-to counter cache through the class method
`klass.update_counters(id, counter => by, touch:)`, so the locking override
applies and the counter + touch + lock bump land in one statement.

## Acceptance criteria

- Belongs-to counter cache (incl. polymorphic) bumps `lock_version` once per
  operation, combined with the `touch`, without raising `StaleObjectError`.
- Unskip and pass both Car/Wheel cases with Rails-verbatim test names.
- No regressions in counter-cache / belongs-to / timestamp suites.
