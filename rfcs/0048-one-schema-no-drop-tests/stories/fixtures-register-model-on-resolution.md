---
title: "Fold registerModel into fixture-set resolution"
status: claimed
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: 1
pr: null
claim: "2026-06-30T19:13:44Z"
assignee: "fixtures-register-model-on-resolution"
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

## Findings (2026-06-30, from PR #4345 fixtures-additive-surface)

- PR #4345 landed the `fixtures()` surface AND defaulted its `schema` to the
  canonical `TEST_SCHEMA`, so the converted `collection-proxy.test.ts` now has
  exactly ONE remaining piece of non-Rails boilerplate: the 10-line
  `registerModel(...)` block. These two stories (parts 1+2) are what retire it.
- Verified empirically: deleting the whole `registerModel` block from
  `collection-proxy.test.ts` and running it in isolation fails **40 of 41 tests**
  with `NameError: Model '...' not found in registry` (thrown at
  `reflection.ts:662` via `HasManyReflection._klass`). This is the regression
  this story's auto-registration prevents — use it as the acceptance probe.
- collection-proxy's 10 registrations partition cleanly across the two parts.
  **Part 1 (this story) covers the 6 fixture-backed models** — their sets ARE
  declared via `fixtures([...])`: `authors`→`Author`, `posts`→`Post`,
  `cpkAuthors`→`CpkAuthor`, `cpkBooks`→`CpkBook`, `pets`→`Pet`, `toys`→`Toy`.
  The remaining 4 — `Comment`, `Tagging`, `Tag`, `Owner` — are association
  _targets_ with no fixture set of their own, so this file does NOT fully clean
  until part 2 (`fixtures-autoload-canonical-model-index`) also lands. Pick a
  file whose every registration is fixture-backed if you want a clean
  all-lines-deleted demo for THIS story alone.
- Line refs above (collection-proxy.test.ts:22-29) predate PR #4345; the block
  is now lines 21-30 and the `fixtures()` calls carry no `schema` arg.
