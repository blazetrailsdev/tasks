---
title: "Convert OverridingAssociationsTest describe in associations.test.ts to canonical"
status: ready
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up from `assoc-associations-test-wave-final-drop-exclude` (PR #3589).
The `OverridingAssociationsTest` describe in
`packages/activerecord/src/associations.test.ts` (~210 LOC) still calls
`defineSchema` with the bespoke `oa_brokens` table and defines inline
`OA*` models / `oa_*` join tables.

- trails: `packages/activerecord/src/associations.test.ts` (`OverridingAssociationsTest` describe)
- Rails: `vendor/rails/activerecord/test/cases/associations_test.rb` (`OverridingAssociationsTest`)

## Acceptance criteria

- [ ] Convert the `OverridingAssociationsTest` describe onto canonical
      `TEST_SCHEMA` + official models + fixtures, matching Rails test names verbatim.
- [ ] Remove the describe's bespoke `defineSchema` block.
- [ ] test:compare delta non-negative.
