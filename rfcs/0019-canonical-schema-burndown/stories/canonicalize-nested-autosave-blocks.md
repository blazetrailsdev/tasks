---
title: "Canonicalize nested-attributes autosave describe blocks (Rails-guided + HasOne/HasMany autosave)"
status: in-progress
updated: 2026-06-19
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: 3637
claim: "2026-06-19T12:12:27Z"
assignee: "canonicalize-nested-autosave-blocks"
blocked-by: null
---

## Context

`packages/activerecord/src/nested-attributes.test.ts` lines 2680–3413 span two large describe blocks:

- `Nested Attributes (Rails-guided)` (2680–2891): makeModels() creating Pirate/Ship/Part with non-canonical associations (hasMany ships on Pirate); also inline Post/Comment and AE1Article/AE1Tag bespoke classes.
- `TestHasOneAutosaveAssociationWhichItselfHasAutosaveAssociations` (2893–3104): makeModels() with Pirate/Ship/Part autosave chain.
- `TestHasManyAutosaveAssociationWhichItselfHasAutosaveAssociations` (3105–3413): makeModels() with Pirate/Ship/Part; the cr\_\* bespoke classes were already removed in PR #3604.

The autosave blocks use `Pirate.hasMany("ships")` (not canonical `Pirate.hasOne("ship")`), which means full canonicalization requires restructuring tests to match Rails' Ship-centric `TestHasManyAutosaveAssociationWhichItselfHasAutosaveAssociations` (which uses `@ship.parts_attributes` not `@pirate.ships_attributes`). Rails source: nested_attributes_test.rb lines 1089–1165.

## Acceptance criteria

- Convert autosave describe blocks to use canonical Ship (with `hasMany("parts", { className: "ShipPart" })`) matching how Rails structures the tests.
- Remove `ae1_articles`, `ae1_tags`, and remaining prefixed article/tag tables from TEST_SCHEMA.
- Test names verbatim. No regressions in test:compare.
- 500 LOC ceiling per PR; split by describe block from main with non-overlapping scope.
