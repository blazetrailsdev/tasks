---
title: "api-compare: a const named after the Rails module is the instance seat, so timestamp/persistence/normalization drop InstanceMethods"
status: draft
updated: 2026-10-02
rfc: "0179-api-compare-crediting-rules"
cluster: surface
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-root-n-z` audit: the receipts below were `PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged `CONVERGEABLE` onto this story.

Three top-level activerecord files group a Rails module's instance half in an object literal named
`InstanceMethods`, a name none of the three Rails files declares, so each scores as a moved extra and
carries `@noRailsEquivalent`:

- `packages/activerecord/src/timestamp.ts` `InstanceMethods` — `module Timestamp`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/timestamp.rb:43`), whose instance half
  (`:147-161`) re-declares four names its `ClassMethods` (`:55-81`) also declares:
  `timestamp_attributes_for_create_in_model`, `timestamp_attributes_for_update_in_model`,
  `all_timestamp_attributes_in_model`, `current_time_from_proper_timezone`.
- `packages/activerecord/src/persistence.ts` `InstanceMethods` — `module Persistence`, which
  declares `_update_record` on `ClassMethods`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb:263`) and on the instance (`:900`).
- `packages/activerecord/src/normalization.ts` `InstanceMethods` — `module Normalization`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/normalization.rb:5-12`), whose `included` block
  declares `class_attribute :normalized_attributes`.

The settled spelling for a Rails module is a const named after it (`Core`, `CounterCache`,
`SignedId`, `ModelSchema`, each included as `include(Base, CounterCache.CounterCache)`). The audit
renamed all three that way and reverted them, because the comparator pairs by the literal owner name:

- `tsOwnerSeat` (`scripts/api-compare/compare.ts`) answers the instance seat only for an owner
  spelled `InstanceMethods`. Under `Timestamp`, the Ruby `ClassMethods#current_time_from_proper_timezone`
  paired with the const's instance member: `parity:api:calls` raised a new `with_connection` row on it
  and `parity:api:receipts:gate` reported the free export's receipt as uncompared.
- Under `Persistence`, `persistence.rb -> persistence.ts` dropped from 60/60 to 59/60
  (`_update_record` missing).
- Under `Normalization`, `normalization.rb -> normalization.ts` dropped from 22/22 to 19/22: the
  three `normalized_attributes` accessors the `classAttribute.call` site credits went missing, though
  `ts-api.json` lists them on the `Normalization` module.

`nested-attributes.ts` (`NestedAttributes`) and `translation.ts` (`Translation`) took the rename in
the audit PR with no movement, because neither Rails file declares one name on both halves.

## Acceptance criteria

- [ ] `tsOwnerSeat` reads a const named after the Rails module the file mirrors as the instance seat, with a unit test for a file that declares one name on both halves.
- [ ] The `classAttribute.call` credit under a module-named const pairs with all of the Ruby `class_attribute` rows, with a unit test.
- [ ] `timestamp.ts`, `persistence.ts` and `normalization.ts` export `Timestamp` / `Persistence` / `Normalization`, their three receipts are deleted, and `base.ts`, `callbacks.ts` and `attribute-methods/dirty.ts` include them by that name.
- [ ] `pnpm parity:api` stays at 60/60, 22/22 and the current `timestamp.rb` figure; `pnpm parity:api:calls`, `:extra:gate` and `:receipts:gate` green.
