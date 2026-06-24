---
title: "Convert + un-skip bespoke TestDestroyAsPartOfAutosaveAssociation block to canonical models"
status: done
updated: 2026-06-24
rfc: "0043-bespoke-test-bloat-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 4076
claim: "2026-06-24T18:14:41Z"
assignee: "autosave-destroy-describe-canonical-unskip"
blocked-by: null
---

## Context

`packages/activerecord/src/autosave-association.test.ts` contains a large
`describe.skip("TestDestroyAsPartOfAutosaveAssociation", ...)` block (around
line 206) that builds bespoke inline models (`class Pirate`/`Ship`/`Bird`/`Part
extends Base` via a local `makePirateShip()` factory) instead of the canonical
`test-helpers/models/{pirate,ship,bird}.ts`. The whole block is skipped, so its
ported Rails `autosave_association_test.rb` destroy tests (the
`should destroy ...`, `a child marked for destruction ...` family) contribute
nothing to test:compare. PR #4068 added a new canonical-model describe for the
remove-callback tests alongside it but deliberately did not touch the skipped
block.

This violates the canonical-schema rule (CLAUDE.md `defineSchema` / bespoke-table
prohibition) and leaves real coverage dark.

## Acceptance criteria

- Convert the `TestDestroyAsPartOfAutosaveAssociation` block to use the
  canonical `Pirate`/`Ship`/`Bird`/`Part` models plus `TEST_SCHEMA`, and un-skip
  it (drop the `.skip`).
- Keep Rails test names verbatim; fix the implementation, not the names, for any
  that fail once on canonical models.
- test:compare delta for `autosave_association_test.rb` is non-negative.
