---
title: "Converge hasOne updateOnly nested-attrs tests to canonical update_only_ship association"
status: ready
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

In `packages/activerecord/src/nested-attributes.test.ts`, the
`TestNestedAttributesOnAHasOneAssociation` block's `update_only`-option tests
(`should accept update only option`, `should create new model when nothing is
there and update only is true`, `should update existing when update only is
true and no id is given` / `... and id is given`, `should destroy existing when
update only is true ...`) configure the option by calling
`acceptsNestedAttributesFor(Pirate, "ship", { updateOnly: true })` — i.e. they
reconfigure the SAME `ship` has_one association per test and assign
`shipAttributes`.

Rails (`vendor/rails/activerecord/test/cases/nested_attributes_test.rb`
~line 400, class `TestNestedAttributesOnAHasOneAssociation`) instead routes
these through a DEDICATED association: `Pirate has_one :update_only_ship`
declared with `update_only: true`, and the tests assign
`update_only_ship_attributes`. The canonical Pirate model already declares
`hasOne("updateOnlyShip", { className: "Ship" })` (`test-helpers/models/pirate.rb`).

## Deviation

trails tests exercise updateOnly by mutating the `ship` config rather than via
the canonical `updateOnlyShip` association, so they don't cover the dedicated
declared-option path Rails uses.

## Acceptance criteria

- Converge the `update_only`-option hasOne tests to assign
  `updateOnlyShipAttributes` against the canonical `updateOnlyShip`
  association (add `acceptsNestedAttributesFor(Pirate, "updateOnlyShip",
{ updateOnly: true })` where needed) rather than reconfiguring `ship`.
- Test names stay verbatim. No test:compare regression.
