---
title: "converge-autosave-association-pirate-ship-bird-parrot-shadows"
status: ready
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up pass 2 of `converge-autosave-association-bespoke-registermodel-canonical-shadows`
(PR converged `TestAutosaveAssociationOnAHasOneAssociation`,
`TestAutosaveAssociationOnABelongsToAssociation`, the Firm/Account
`makeModels()` in `TestDefaultAutosaveAssociationOnAHasOneAssociation`, and the
Eye/Iris pair).

`packages/activerecord/src/autosave-association.test.ts` still registers bespoke
classes under canonical **Pirate / Ship / Bird / Parrot** names, which the
`registerModel` canonical-shadow guard
(`packages/activerecord/src/associations.ts` — `guardCanonicalNameShadow`)
rejects once the file imports `./test-helpers/canonical-model-index.js`.

Sites (line numbers as of the pass-1 commit):

- 2420/2421 Pirate+Bird (`TestDefaultAutosaveAssociationOnAHasManyAssociationWithAcceptsNestedAttributes`)
- 2704/2705 Ship+Pirate (`TestAutosaveAssociationsInGeneral`)
- 3261/3262 Parrot+Pirate
- 3370/3371 Pirate+Ship (`TestHasManyAutosaveAssociationWhichItselfHasAutosaveAssociations`)
- 3703/3704 Pirate+Ship (`TestHasOneAutosaveAssociationWhichItselfHasAutosaveAssociations`)
- 3888/3889 Ship+Pirate (`TestDefaultAutosaveAssociationOnNewRecord`)
- 4448/4449 Pirate+Bird

Canonical models: `test-helpers/models/{pirate,ship,ship-part,bird,parrot}.ts`.
Rails source: `vendor/rails/activerecord/test/cases/autosave_association_test.rb`
plus `test/models/{pirate,ship,bird,parrot}.rb`.

## Acceptance criteria

- Each listed site uses the canonical model (read the corresponding Rails test
  first; do NOT rename tests), or a distinct non-canonical name where no
  canonical model fits.
- Existing tests stay green (`pnpm vitest run packages/activerecord/src/autosave-association.test.ts`).
- 500 LOC ceiling; single PR from `main`, no stacking. Register a further
  follow-up story if it does not all fit.
