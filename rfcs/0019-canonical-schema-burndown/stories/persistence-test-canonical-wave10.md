---
title: "persistence.test.ts canonical burndown wave10 (remaining defineSchema blocks)"
status: in-progress
updated: 2026-06-21
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 3841
claim: "2026-06-21T22:14:43Z"
assignee: "persistence-test-canonical-wave10"
blocked-by: null
---

## Context

Continuation of `persistence-test-canonical-wave9` (#3828), which deleted the
last bespoke invented-name `Article` describe block (its own `defineSchema` +
the `save`→`reload` deviations) from
`packages/activerecord/src/persistence.test.ts`.

Remaining bespoke `defineSchema(...)` describe blocks on `origin/main`
(line numbers as of merge of #3828, file is 1637 lines):

- ~line 484 / `defineSchema` @488
- ~line 637 / `defineSchema` @642
- ~line 872 / `defineSchema` @876
- ~line 921 / `defineSchema` @926
- ~line 1447 / `defineSchema` @1459
- ~line 1602 / `defineSchema` @1607

Each is a `describe("PersistenceTest", ...)` block using `defineSchema` with
bespoke/invented table shapes instead of the canonical `TEST_SCHEMA` +
fixtures. Audit each against
`vendor/rails/activerecord/test/cases/persistence_test.rb`: port genuine
Rails-named tests to canonical models + fixtures (names verbatim), delete pure
deviations whose behavior is already covered by canonical Rails-named tests
elsewhere in the file.

## Acceptance criteria

- [ ] Convert/delete the next coherent slice (one PR, <=500 LOC). Real Rails
      tests -> canonical models + fixtures, names verbatim; pure deviations deleted.
- [ ] No new duplicate test names.
- [ ] `pnpm vitest run packages/activerecord/src/persistence.test.ts` passes;
      `pnpm lint` and `node scripts/typecheck.mjs` clean; test:compare delta non-negative.
- [ ] Register a further wave story if more than one PR of work remains; remove
      `persistence.test.ts` from `eslint/require-canonical-schema-exclude.json`
      only once FULLY converted (no `defineSchema`, no `eslint-disable`).
