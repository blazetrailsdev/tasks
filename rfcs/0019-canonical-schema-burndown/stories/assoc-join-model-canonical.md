---
title: "join-model.test.ts → canonical schema (split)"
status: ready
updated: 2026-06-16
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 500
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert `packages/activerecord/src/associations/join-model.test.ts` (~2561 LOC, **116 inline tables**)
onto the canonical schema, matched to Rails.

- trails: `associations/join-model.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations/join_model_test.rb`

Rails drives `Tag`/`Tagging`/`Post`/`Author`/`Categorization`/`Category` has_many :through join models — all canonical. The inline tables are per-test scratch
shapes; collapse onto the canonical association tables or rename file-unique
where a column has no `schema.rb` analog.

~2561 LOC, 116 tables: split per-describe across sibling PRs off `main` (NOT
stacked). Register remaining waves as new stories.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `associations/join_model_test.rb` FIRST; port each body word-for-word. Test names unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Replace bespoke models with the canonical registry models (`Tag`/`Tagging`/`Post`/`Author`/`Categorization`/`Category` has_many :through join models) and
      their Rails associations; rows via `fixtures` + `name(:label)` where Rails
      does.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/associations/join-model.test.ts` passes (co-run colliding
      siblings under `maxForks=1`).

## Definition of done

A PR that swaps the schema but leaves bodies diverging from Rails is **not
done** — fidelity is the deliverable. An `eslint-disable` or leaving the file in
the exclude JSON does **not** close this story.
