---
title: "Align belongs_to inverse wiring with Rails so isStaleTarget() is correct after has_many push"
status: draft
updated: 2026-06-14
rfc: "0016-ar-test-compare-100"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced in PR #3248 review. trails' shared inverse-wiring primitive
`associations.ts#_cacheSingularTarget` caches a belongs_to target via
`SingularAssociation#setTarget` WITHOUT writing the owner foreign key. Rails'
`set_inverse_instance` instead runs the belongs_to's `inversed_from` →
`replace_keys`, which writes the owner FK *before* the stale-state snapshot is
taken. As a result, when a record is folded into a has_many owner via `<<` /
`push` (inverse wired first, FK written later by `insert_record`), trails'
`_staleState` snapshots a nil FK and `Association#isStaleTarget()` then
spuriously returns true.

PR #3248 worked around this locally in `BelongsToAssociation#updateCounters`
by testing FK==PK directly (`targetMatchesOwnerForeignKey`) instead of
`!isStaleTarget()`. That is correct for the counter-cache path, but every
other caller of `isStaleTarget()` is still exposed to the same lag.

## Acceptance criteria

- Route the belongs_to branch of `_cacheSingularTarget` (and/or the has_many
  push inverse wiring) through `BelongsToAssociation#inversedFrom` so the owner
  FK is written during inverse wiring, mirroring Rails
  `set_inverse_instance → inversed_from → replace_keys`. `replace_keys` is a
  no-op when the FK already matches (force: false), so preload/eager paths
  where the FK is already correct must not become dirty.
- After the fix, `BelongsToAssociation#updateCounters` can drop
  `targetMatchesOwnerForeignKey` and use `target && !isStaleTarget()` (Rails
  `belongs_to_association.rb:111`); the two `OptimisticLockingTest` cases
  (`counter cache with touch and lock version`,
  `polymorphic destroy with dependencies and lock version`) must stay green.
- No regressions across association preload/eager/through/inverse-of suites
  (dirty tracking on preloaded belongs_to records in particular).
- Test names match Rails verbatim.
