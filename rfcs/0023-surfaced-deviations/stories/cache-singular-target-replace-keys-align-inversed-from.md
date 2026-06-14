---
title: "Align _cacheSingularTarget with Rails inversed_from (replace_keys) so isStaleTarget is authoritative"
status: draft
updated: 2026-06-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while implementing `locking-belongs-to-inverse-stale-state` (PR #3305).

Rails' `BelongsToAssociation#inversed_from(record)` runs `replace_keys(record)`
(writing the owner's FK) _before_ `super` snapshots `@stale_state` via
`loaded!`. trails' shared inverse primitive
`associations.ts#_cacheSingularTarget` caches the target with `setTarget`
WITHOUT the `replace_keys` FK write, so the holder's `_staleState` snapshots a
nil/stale FK and `isStaleTarget()` over-reports on the has_many `<<`/push path.

Because of this, two read sites can't trust the authoritative `isStaleTarget()`
snapshot and instead use FK==PK local substitutes:

- `belongs-to-association.ts#isCachedTargetStale` — added by PR #3305 for the
  inner `loadBelongsTo` cached short-circuit (Rails' `stale_target?`).
- `belongs-to-association.ts` `update_counters` — uses
  `targetMatchesOwnerForeignKey` instead of `isStaleTarget()` (pre-existing,
  documented in that method's comment: "Follow-up: align the primitive with
  Rails").

Routing `_cacheSingularTarget` through `inversedFrom`/`replaceKeys` was
deliberately deferred because it mutates owner FKs during read-side
inverse/preload wiring across the whole codebase — out of scope for the locking
change.

## Acceptance criteria

- `_cacheSingularTarget` (or the path feeding it on the has_many push) writes
  the owner FK before the stale-state snapshot, matching Rails `inversed_from`
  → `replace_keys` → `loaded!`.
- `BelongsToAssociation#isStaleTarget()` is authoritative for both read sites;
  the FK==PK substitutes `isCachedTargetStale` and the `targetMatchesOwnerForeignKey`
  use in `update_counters` are removed (or reduced to the genuinely-different
  null-handling cases) without regressing tests.
- No api:compare / test:compare regression; counter-cache, inverse-of, and
  locking suites stay green.
