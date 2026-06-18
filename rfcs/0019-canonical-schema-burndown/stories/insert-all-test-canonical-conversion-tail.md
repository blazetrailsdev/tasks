---
title: "insert-all-test-canonical-conversion-tail"
status: ready
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC 0019 canonical conversion of `packages/activerecord/src/insert-all.test.ts`,
continued. The first slice (PR for d2-insert-all-unique-index-introspection)
converted the unique-index / index-finding tests to the canonical
`InsertAllTest` describe (CanonicalBook/CanonicalSpeedometer +
useHandlerFixtures on the canonical TEST_SCHEMA) and added the schema.rb `books`
indexes to TEST_SCHEMA.

The file still contains bespoke describes that must be converted before the
`eslint/require-canonical-schema-exclude.json` entry can be dropped:

- The first `describe("InsertAllTest")` (insert-all.test.ts) uses a bespoke
  `defineSchema({ books: { title, author, status }, posts, items, cpk_orders,
ships, categories, developers })` plus `makeBook` / `makeShip` /
  `makeDeveloper` / `makeCategoryHierarchy` / `makeBookWithAdapter` factories
  (title/author instead of canonical name/author_id).
- The `insertAll / upsertAll` and `insertAll / upsertAll (Rails-guided)`
  describes define bespoke `books { title, author }`.
- The `InsertAll async uniqueIndexes regression` describe builds bespoke
  `pkgs` / `flags` tables with addIndex.

## Acceptance criteria

- [ ] All describes in insert-all.test.ts use the canonical TEST_SCHEMA +
      official models (test-helpers/models/) via useHandlerFixtures /
      setupHandlerSuite; no bespoke/inline defineSchema tables remain.
- [ ] Test names unchanged (test:compare parity preserved).
- [ ] Remove `packages/activerecord/src/insert-all.test.ts` from
      `eslint/require-canonical-schema-exclude.json` (flips the
      `blazetrails/require-canonical-schema` lint ON for the file).
- [ ] Split into <=500-LOC slices if needed; the exclude entry comes off only
      in the final slice.
