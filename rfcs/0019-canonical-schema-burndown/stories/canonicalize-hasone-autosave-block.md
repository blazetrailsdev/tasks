---
title: "canonicalize-hasone-autosave-block"
status: claimed
updated: 2026-06-19
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-19T13:05:28Z"
assignee: "canonicalize-hasone-autosave-block"
blocked-by: null
---

## Context

Sibling of `canonicalize-nested-autosave-blocks`. That PR canonicalized the
`TestHasManyAutosaveAssociationWhichItselfHasAutosaveAssociations` block and the
Rails-guided AE1 test, but the
`TestHasOneAutosaveAssociationWhichItselfHasAutosaveAssociations` block in
`packages/activerecord/src/nested-attributes.test.ts` was left on its bespoke
Pirate/Ship/Part + GGC*/GGD*/GGA\* inline classes to keep the first PR under the
500-LOC ceiling (the combined diff was ~590 LOC in the test file alone).

The canonical autosave-validation parity fix in `nested-attributes.ts`
(`defineAutosaveValidationCallbacks` re-run + `reflection.autosave = true`) is
already merged with the has-many PR, so this block only needs the test rewrite.

Rails source: nested_attributes_test.rb lines 1048-1089
(`TestHasOneAutosaveAssociationWhichItselfHasAutosaveAssociations`): the chain is
Pirate `has_one :ship` → Ship `has_many :parts` (ShipPart) → ShipPart
`has_many :trinkets` (Treasure, as: :looter), seeded via
`@pirate.create_ship` / `@ship.parts.create!` / `@part.trinkets.create!`, and
the via-attributes tests use
`@pirate.attributes = { ship_attributes: { ... parts_attributes: [{ ... trinkets_attributes: [...] }] } }`.

A reference implementation of the canonical block (using CanonicalPirate /
CanonicalShip / ShipPart / Treasure, `cacheAssoc(pirate, "ship", ship)` for the
one-to-one root, and `ship.parts.create` / `part.trinkets.create` to populate
the collection proxies so the nested writers find the loaded targets) was
verified green during the has-many PR before being reverted to fit the ceiling.

## Acceptance criteria

- Convert `TestHasOneAutosaveAssociationWhichItselfHasAutosaveAssociations` to
  the canonical Pirate → Ship → ShipPart → Treasure chain, removing the bespoke
  Pirate/Ship/Part makeModels and the GGC*/GGD*/GGA\* inline classes.
- Test names verbatim. No regressions in test:compare.
- Populate collection children via `ship.parts.create` / `part.trinkets.create`
  (collection-proxy store), not `association().setTarget`, so the
  `partsAttributes` / `trinketsAttributes` nested writers match the loaded
  records (the proxy store `_collectionProxies` differs from the singular
  `_associationInstances` store).
- 500 LOC ceiling; single PR from main.
