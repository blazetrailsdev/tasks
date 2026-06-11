---
title: "batches.test.ts -> batches_test.rb canonical port"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 400
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert `packages/activerecord/src/batches.test.ts` (~2033 LOC, 7 inline tables)
onto the canonical schema, matched to Rails.

- trails: `batches.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/batches_test.rb`

Rails drives `Post`/`Comment`/`Subscriber` for `find_each`/`find_in_batches`/
`in_batches` cursor and ordering cases — all canonical. Ride the canonical
tables.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `batches_test.rb` FIRST; port each body word-for-word. Test names
      unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical models; rows via `fixtures` + `name(:label)` where Rails
      does.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/batches.test.ts` passes.

## Notes

- ~2033 LOC: split per-describe across sibling PRs off `main` (NOT stacked).
  Ship what fits; register the remainder as a new story.

## Definition of done

Fidelity is the deliverable. An `eslint-disable` or leaving the file excluded
does **not** close this story.
