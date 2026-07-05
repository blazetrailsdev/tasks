---
title: "Autoload fallback for canonical models (Zeitwerk analog)"
status: ready
updated: 2026-07-05
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

# Autoload fallback for canonical models (Zeitwerk analog)

Part 2 of 4 converging the AR fixtures helper to the Rails `fixtures :authors`
surface (RFC 0048 capstone). **No 0019 gate.** This is the genuinely novel piece —
a Zeitwerk analog over test-helpers/models/index.ts — and the largest of the four.

## Context

After part (a), models whose _fixtures_ a test loads are auto-registered. But
tests routinely reference a model only as an association _target_ (a `hasMany`
target with no fixture set of its own) — in Rails those just autoload on first
constant reference; in trails they still need a manual `registerModel`.

The Rails-faithful fix is to mirror Zeitwerk: when `resolveModel(name)`
(associations.ts:307) misses `modelRegistry`, resolve the class by name from an
eager canonical-models index built from test-helpers/models/index.ts, register
it, and return it. `resolveModel` is synchronous, so the index must be built
eagerly (a one-time side-effect import of the canonical barrel) rather than via
`await import()` — this is the trails equivalent of "Zeitwerk has indexed
test/models/."

## Acceptance criteria

- [ ] An eager canonical name→class index is built from
      test-helpers/models/index.ts (every exported AR model class).
- [ ] `resolveModel` (associations.ts:307) falls back to the index on a
      modelRegistry miss, registering and returning the class.
- [ ] A genuine miss (name in neither registry nor index) still THROWS a
      constant-not-found error — asserted by test — so the fallback can never
      silently mask a missing/misnamed model. The current
      "Did you call registerModel?" NameError becomes a real "constant not found"
      matching Rails.
- [ ] Demonstrated by deleting association-target-only `registerModel` lines from
      ≥1 canonical file; LOC delta noted.
- [ ] test:compare does not regress; no test names change.

## Notes

- Collision hazard: an eager canonical index could shadow a grandfathered
  bespoke same-named `class Post`/`class Author`. Within a converged canonical
  test that is the desired resolution, but broad rollout assumes 0019 has retired
  bespoke same-named classes — land the mechanism, but only delete a given file's
  manual registrations once that file is canonical.

## Findings (2026-06-30, from PR #4345 fixtures-additive-surface)

- This part is specifically what lets `collection-proxy.test.ts` delete its LAST
  4 `registerModel` lines. After part 1 auto-registers the 6 fixture-backed
  models (`Author`/`Post`/`CpkAuthor`/`CpkBook`/`Pet`/`Toy`), the residue is the
  4 association-_target_-only models with no fixture set of their own:
  `Comment` (`Post hasMany comments`), `Tagging` + `Tag` (the taggings/tags
  through-path), and `Owner` (`Pet belongsTo owner`). None is declared via
  `fixtures([...])`, so only this autoload fallback registers them — making
  collection-proxy the natural end-to-end demo that BOTH parts together fully
  retire a file's registration block.
- Empirical anchor for the "genuine miss still THROWS" criterion: with the
  registration block removed, the current failure is `NameError: Model '...'
not found in registry` at `reflection.ts:662` (`HasManyReflection._klass`).
  The fallback must convert the _resolvable_ names to success while keeping a
  truly-absent constant throwing there — assert both halves.
