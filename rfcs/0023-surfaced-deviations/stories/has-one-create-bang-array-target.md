---
title: "has_one create/createBang stores array target instead of single record"
status: in-progress
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 3721
claim: "2026-06-20T15:37:29Z"
assignee: "has-one-create-bang-array-target"
blocked-by: null
---

## Context

Surfaced in PR #3503. While testing autosave of a `has_one`, calling
`association(human, "autosaveFace").createBang({})` left the singular `has_one`
association's `target` as an **array** (`[face]`) rather than the single Face
record. `autosaveHasOne` reads `inst.target` and bails at
`packages/activerecord/src/autosave-association.ts:503`
(`if (!child || Array.isArray(child) || ...) return true;`) because the target is
an array — so autosave silently skips the child. The PR worked around it in the
test by setting up via `loadTarget()` instead of `createBang`.

Rails' `SingularAssociation#create` / `HasOneAssociation` always store a single
record as `@target`. The trails `SingularAssociation._createRecord`
(`packages/activerecord/src/associations/singular-association.ts:140`) /
`HasOneAssociation` create path appears to write an array-shaped target somewhere
(possibly via a shared collection helper or `_associationCache` surfacing).

Repro: `const f = await association(human, "autosaveFace").createBang({});
human.association("autosaveFace").target` is `[Face]`, expected `Face`.

## Acceptance criteria

- [ ] `association(owner, hasOneName).create/createBang(...)` stores a single
      record as the association `target` (not an array).
- [ ] `autosaveHasOne` no longer bails on a `has_one` created via `createBang`.
- [ ] Add a regression test asserting `has_one` create target shape +
      autosave-after-create wiring.
