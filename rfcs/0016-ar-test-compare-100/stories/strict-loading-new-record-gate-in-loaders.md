---
title: "Gate strict-loading violation behind find_target? new-record check in functional loaders"
status: draft
updated: 2026-06-13
rfc: "0016-ar-test-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced during #3196 (f9g2-strict-loading-association-build). The functional
loaders `loadHasOne` / `loadHasMany` / `loadBelongsTo` / `loadHabtm` in
`packages/activerecord/src/associations.ts` run the `_violatesStrictLoading`
check BEFORE the null-PK / null-FK short-circuit. Rails reaches
`violates_strict_loading?` only from inside `find_target`, which is gated by
`find_target?` = `!loaded? && (!owner.new_record? || foreign_key_present?) &&
klass` (association.rb:320). So a new-record strict-loading owner WITHOUT the
foreign key present never raises on a lazy load — it returns nil/[] silently.

The existing comment at `associations.ts:1916-1921` (loadHabtm) explicitly
defers this: "Replicating that requires a find_target?-style new-record check
ahead of this guard across all collection loaders; deferred."

PR #3196 fixed the build/writer (CollectionProxy `push`/`clear`) path, but the
lazy-LOAD path still diverges. It was only masked in the has-one-through test
because a belongs_to-through builds the join in memory at writer time
(`eagerBuildThroughForNewOwner`), avoiding the load entirely; a has_one-through
on a new strict owner still raises a `StrictLoadingViolationError` where Rails
would not (observed in `has-one-through-association.ts` createThroughRecord →
`throughProxy.loadTarget()`).

Fix: gate the violation behind a `find_target?`-equivalent check (skip when
`owner.new_record? && !foreign_key_present?`) in each functional loader,
reusing the same two-branch (through / non-through) `foreignKeyPresent` dispatch
already present on the OO association and `CollectionProxy._foreignKeyPresent`.

## Acceptance criteria

- New-record strict-loading owner without FK present does NOT raise on lazy
  load via `loadHasOne` / `loadHasMany` / `loadBelongsTo` / `loadHabtm`
  (returns nil/[]), matching Rails `find_target?`.
- New-record owner WITH FK present (e.g. belongs_to, through-via-belongs-to)
  still raises, matching `null_scope?` / `find_target?` semantics.
- Persisted-owner behavior unchanged.
- Remove the deferral note at `associations.ts:1916-1921`.
