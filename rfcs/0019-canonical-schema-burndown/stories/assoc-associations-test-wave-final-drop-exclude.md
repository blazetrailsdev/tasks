---
title: "assoc-associations-test-wave-final-drop-exclude"
status: done
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3589
claim: "2026-06-18T13:39:51Z"
assignee: "assoc-associations-test-wave-final-drop-exclude"
blocked-by: null
---

## Context

FINAL wave of the `associations.test.ts` canonical conversion (RFC 0019),
following `assoc-associations-test-wave9-convert-canonical`. By this point the
Rails-counterpart bodies in the first `AssociationsTest` describe should be
converted (waves 8–9 + the force-reload / finder-sql follow-ups).

Two outstanding pieces remain:

1. **Trails-specific bodies (no direct Rails counterpart)** still bespoke in the
   first describe — decide convergence per the deviation policy, do NOT ratify:
   `has many/has one loads via inline fallback resolving composite owner key from
query constraints`, `setBelongsTo infers/nullifies inferred composite foreign
key`, `delete single composite has many through join row`, `composite has many
through raises ConfigurationError when target model has composite primary key`,
   `polymorphic-through with composite owner primary key requires explicit
single-column primaryKey`. Deferred (blocked on
   `cpk-counter-cache-column-demodulize-convergence`): `loading cpk association
when persisted and in memory differ`.

2. **Drop `associations.test.ts` from
   `eslint/require-canonical-schema-exclude.json`** once ALL describes in the
   file (incl. AssociationProxyTest/PreloaderTest `defineSchema` blocks) are
   canonical. The PreloaderTest and AssociationProxyTest describes still call
   `defineSchema` with bespoke tables and must be converted to canonical
   `TEST_SCHEMA` + fixtures/official models first.

- trails: `packages/activerecord/src/associations.test.ts`,
  `eslint/require-canonical-schema-exclude.json`
- Rails: `vendor/rails/activerecord/test/cases/associations_test.rb`

## Acceptance criteria

Scope was narrowed (per owner) to the first `AssociationsTest` describe; the
broader describe conversions + exclude-drop were split into follow-up stories.

- [x] Converge or faithfully convert the trails-specific bespoke bodies (no
      ratification). — PR #3589: converted inline-fallback has_many/has_one +
      composite hmt-delete onto canonical Sharded models; removed 4 deviation
      bodies with convergence stories
      ([[setbelongsto-composite-fk-inference-convergence]],
      [[composite-hmt-composite-pk-target-convergence]],
      [[polymorphic-through-composite-owner-convergence]]).
- [x] Remove remaining scratch tables from the first describe's `defineSchema` —
      reduced to only the deferred cpk body's tables (`cpk_orders`,
      `cpk_order_items`).
- [~] Convert AssociationProxyTest and PreloaderTest `defineSchema` blocks —
  DEFERRED to [[associations-test-associationproxytest-canonical]],
  [[associations-test-preloadertest-canonical]] (+ also
  [[associations-test-overridingassociationstest-canonical]]).
- [~] Drop `associations.test.ts` from the exclude list — DEFERRED to
  [[associations-test-drop-exclude-final]] (blocked on the three describe
  conversions above + [[cpk-counter-cache-column-demodulize-convergence]]).
- [x] test:compare delta non-negative. — associations.test.ts 128/128, no source
      changes (api:compare unaffected).
