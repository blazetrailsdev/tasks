---
title: "validations/numericality-validation → NumericData canonical model + fixtures"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 200
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert `packages/activerecord/src/validations/numericality-validation.test.ts`
(~156 LOC, 4 inline tables) onto the canonical schema, matched to Rails.

- trails: `validations/numericality-validation.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/validations/numericality_validation_test.rb`

Rails drives `NumericData` (`numeric_data` table, decimal/float/integer columns)
and `Topic` — both canonical. Replace the 4 inline tables and bespoke classes
with the registry `NumericData`.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `numericality_validation_test.rb` FIRST; port each body word-for-word.
      Test names unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical `NumericData` with `validates_numericality_of`; rows via
      `fixtures` + `name(:label)` where Rails does.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/validations/numericality-validation.test.ts`
      passes.

## Definition of done

Fidelity is the deliverable. An `eslint-disable` or leaving the file excluded
does **not** close this story.
