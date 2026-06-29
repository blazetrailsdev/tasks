---
title: "Fold registerModel into fixture-set resolution"
status: draft
updated: 2026-06-29
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

# Fold registerModel into fixture-set resolution

Part 1 of 4 converging the AR fixtures helper to the Rails `fixtures :authors`
surface (RFC 0048 capstone). **No 0019 gate** — this leaves all escape hatches
in place; it only makes the common case automatic.

## Context

Association string-resolution bottoms out at `modelRegistry.get(...)`
(packages/activerecord/src/associations.ts:307; reflection paths
reflection.ts:366,667,1252), and `modelRegistry` (associations.ts:222) is written
ONLY by explicit `registerModel` (associations.ts:257). Rails needs no such call —
Zeitwerk autoloads the constant on first reference. Even fully-canonical tests
hand-register today (associations/collection-proxy.test.ts:22-29).

`useFixtures` already resolves every declared set's model class —
`const m = await entry.model()` in `resolveFixtureNames`
(test-helpers/use-fixtures.ts:133) — so registration can ride along there: a
declared fixture set should make its model resolvable, exactly as `fixtures
:authors` does in Rails.

## Acceptance criteria

- [ ] `registerModel(m)` folded into `resolveFixtureNames` (use-fixtures.ts:133),
      so declaring a fixture set registers its model. Idempotent (Map.set) across
      files/tests.
- [ ] STI subclasses routed via the array form's `registerSubclass` logic
      (associations.ts:261-274) so `findStiClass` still resolves.
- [ ] The hand-rolled special cases in fixtures-registry.ts collapse into this
      path: `registerModel(Computer)` :291, parrot :441-442, vegetable :599-601.
- [ ] Demonstrated on ≥1 canonical file (e.g. collection-proxy.test.ts:22-29) by
      deleting its now-redundant `registerModel` lines; LOC delta noted in the PR.
- [ ] test:compare does not regress; no test names change.

## Notes

- Association _targets_ declared without their own fixture set are NOT covered
  here — that's the autoload fallback (part b). This part only removes
  registration for fixture-backed models.
