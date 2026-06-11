---
title: "cascaded-eager-loading.test.ts → canonical schema"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert `packages/activerecord/src/associations/cascaded-eager-loading.test.ts` (~482 LOC, **13 inline tables**)
onto the canonical schema, matched to Rails.

- trails: `associations/cascaded-eager-loading.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations/cascaded_eager_loading_test.rb`

Rails drives `Author`/`Post`/`Comment`/`Categorization`/`Category` nested eager-loading — all canonical. The inline tables are per-test scratch
shapes; collapse onto the canonical association tables or rename file-unique
where a column has no `schema.rb` analog.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `associations/cascaded_eager_loading_test.rb` FIRST; port each body word-for-word. Test names unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Replace bespoke models with the canonical registry models (`Author`/`Post`/`Comment`/`Categorization`/`Category` nested eager-loading) and
      their Rails associations; rows via `fixtures` + `name(:label)` where Rails
      does.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/associations/cascaded-eager-loading.test.ts` passes (co-run colliding
      siblings under `maxForks=1`).

## Definition of done

A PR that swaps the schema but leaves bodies diverging from Rails is **not
done** — fidelity is the deliverable. An `eslint-disable` or leaving the file in
the exclude JSON does **not** close this story.
