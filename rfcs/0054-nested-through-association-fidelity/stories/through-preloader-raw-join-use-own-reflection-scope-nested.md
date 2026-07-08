---
title: "through-preloader-raw-join-use-own-reflection-scope-nested"
status: in-progress
updated: 2026-07-08
rfc: "0054-nested-through-association-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 25
pr: 4800
claim: "2026-07-08T20:22:34Z"
assignee: "through-preloader-raw-join-use-own-reflection-scope-nested"
blocked-by: null
closed-reason: null
---

## Context

Follow-up flagged in review of PR #4741 (story
`hasmany-through-preloader-raise-raw-string-arel-join-scope`) and applying equally
to PR #4526 (has_one variant).

`ThroughAssociation._buildThroughScope` reads the reflection scope's raw
`_joinValues` bucket off `this._reflectionScope`
(`packages/activerecord/src/associations/preloader/through-association.ts` — has_one
branch ~line 457, has_many branch ~line 447) to nest raw string / Arel joins under
the source reflection name and raise `ConfigurationError`, matching Rails'
`through_scope` (`preloader/through_association.rb:117-134`).

For a **nested** through (source reflection is itself a through), `_reflectionScope`
is the whole chain's FLATTENED `join_scopes`, not the outer reflection's OWN scope —
this is exactly the leak the file documents at through-association.ts:189-199, and
why the where-clause partition deliberately reads from `_ownReflectionScope()`
instead of `_reflectionScope`. The raw-join lines do NOT go through
`_ownReflectionScope()`, so a nested has_many/has_one-through whose SUB-CHAIN (not
the outer reflection) carries a raw join could raise `ConfigurationError` for a query
Rails would allow (the raw join belongs to a deeper reflection re-derived at its own
recursive source-preloader stage), or attribute the wrong reflection's joins to the
outer through-scope build.

Not a regression from #4741/#4526 — the flattened-scope read predates both and is
identical in both branches. No canonical model scope currently carries a raw SQL join
on a nested through, so no existing test exercises it; the full nested-through /
preloader / eager suites pass.

## Acceptance criteria

- [ ] Route the raw `_joinValues` read in both `_buildThroughScope` branches through
      `_ownReflectionScope()` (or its `_joinValues` equivalent) rather than the
      flattened `_reflectionScope`, so a nested-through sub-chain's raw join is
      attributed to the reflection that declares it, not the outer through-scope
      build — mirroring how the where-clause partition already uses
      `_ownReflectionScope()`.
- [ ] A nested has_many/has_one-through fixture whose OUTER reflection scope carries
      a raw join still raises `ConfigurationError` (unchanged), AND a case where only
      the SUB-CHAIN carries a raw join does NOT raise at the outer build (deferred to
      the sub-chain's own recursive stage), matching Rails.
- [ ] No regression in has_many_through / has_one_through / nested-through /
      preloader / eager suites.

## Notes

Relevant code: `packages/activerecord/src/associations/preloader/through-association.ts`
(`_buildThroughScope` both branches; `_ownReflectionScope`, `_partitionReflectionWhere`).
Rails: `preloader/through_association.rb:117-134`; `join_dependency.rb:224-226`.
