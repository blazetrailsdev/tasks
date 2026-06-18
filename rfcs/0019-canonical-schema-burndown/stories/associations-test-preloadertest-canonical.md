---
title: "Convert PreloaderTest describe in associations.test.ts to canonical (multi-wave)"
status: claimed
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 500
priority: 50
pr: null
claim: "2026-06-18T21:03:07Z"
assignee: "associations-test-preloadertest-canonical"
blocked-by: null
---

## Context

Follow-up from `assoc-associations-test-wave-final-drop-exclude` (PR #3589).
The `PreloaderTest` describe in
`packages/activerecord/src/associations.test.ts` (~2163 LOC, 49 tests) still
calls `defineSchema` with bespoke tables and defines inline models. This is the
single largest remaining bespoke block in the file.

This is too large for one 500-LOC PR — it must be split into waves (mirroring the
wave3–9 pattern used for the main `AssociationsTest` describe). File child waves
as separate stories as each batch is scoped.

- trails: `packages/activerecord/src/associations.test.ts` (`PreloaderTest` describe)
- Rails: `vendor/rails/activerecord/test/cases/associations_test.rb` (`PreloaderTest`)

## Acceptance criteria

- [ ] Convert the `PreloaderTest` describe onto canonical `TEST_SCHEMA` +
      official models + fixtures, matching Rails test names verbatim, across as
      many waves as needed (each PR <=500 LOC).
- [ ] Remove the describe's bespoke `defineSchema` block.
- [ ] test:compare delta non-negative.
