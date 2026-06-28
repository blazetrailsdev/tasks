---
title: "convert remaining bespoke Eager*/Ej*/Sg* patterns in eager.test.ts to canonical (wave C+)"
status: ready
updated: 2026-06-28
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Wave B (PR #4244) converted 13 bespoke `Eager*` inline class patterns in `EagerAssociationTest`
(lines ~471–927 of `packages/activerecord/src/associations/eager.test.ts`) to canonical models.

Approximately 70 bespoke inline classes remain in the same file:

- `EagerInvParent/EagerInvChild` (eager*inv*\* tables) — "should work inverse of with eager load"
- `EjAuthor/EjPost`, `EjBtAuthor/EjBtPost`, `EjHoUser/EjHoProfile`, `EjEmAuthor/EjEmPost` — explicit-join tests (~928–1062)
- `EagerWidget` — invalid association reference test
- `ExSugPost/ExSugTagging` — suggestions test
- `EagerHmtOrd*`, `EagerHmtMo*` — has-many-through-with-order tests (~1115–1228)
- `EagerLeo*`, `EagerLmo*`, `EagerLn*` — limited-eager tests (~1230–1312)
- `EagerMultiHo*`, `EagerMultiBt*` — multiple-associations-same-table tests (~1313–1391)
- `EagerNode/EagerEdge`, `EagerCount*`, `EagerPk*`, `EagerEmptyBt*`, `EagerReord*` — misc tests (~1393–1603)
- `SgAuthor/SgPost/SgComment/SgMembership/SgMember/SgOrganization/SgSponsor` and `seedSponsors()` — polymorphic guard tests (~1709+)

Also: the `TEST_SCHEMA` constant (~165 lines, 74–239) and `defineSchema(TEST_SCHEMA)` in `beforeAll`
should be removed once all inline bespoke classes are gone.

The file remains in `eslint/require-canonical-schema-exclude.json` until the last `defineSchema` call is removed.

Key Rails reference: `vendor/rails/activerecord/test/cases/associations/eager_test.rb`

## Acceptance criteria

- All remaining bespoke `class Eager*`/`class Ej*`/`class Sg*`/`class Ex*` patterns in `EagerAssociationTest`
  converted to canonical models + fixture data
- `defineSchema(TEST_SCHEMA)` removed from `beforeAll` in `EagerAssociationTest`
- `TEST_SCHEMA` constant removed
- File removed from `eslint/require-canonical-schema-exclude.json`
- All tests pass (202 total, same skip count)
- LOC ≤ 500 per PR; multiple waves allowed
