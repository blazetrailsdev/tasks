---
title: "relation/composite-where.test.ts → canonical CPK models + where_test.rb composite cases"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 150
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert `packages/activerecord/src/relation/composite-where.test.ts` (~246 LOC,
2 inline tables) onto canonical composite-primary-key models.

- trails: `relation/composite-where.test.ts`
- Rails: composite-key `where` cases live in `relation/where_test.rb` and the
  `Cpk::*` model tests; there is no standalone `composite_where_test.rb`
  (fidelity step 4 applies only to the cases mirrored from `where_test.rb`).

Rails' canonical CPK models are `Cpk::Book`/`Cpk::Order`/`Cpk::OrderAgreement`
(`cpk_books`/`cpk_orders` etc., already in `TEST_SCHEMA`). Replace the inline
CPK scratch tables with these.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] For cases mirrored from `where_test.rb`, match the body word-for-word.
      Test names unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical `Cpk::Book`/`Cpk::Order` models; rows via `fixtures` +
      `name(:label)` where Rails does.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/relation/composite-where.test.ts`
      passes.

## Definition of done

Rides the canonical CPK tables; bodies match `where_test.rb` where they mirror
it. An `eslint-disable` or leaving the file excluded does **not** close this
story.
