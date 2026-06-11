---
title: "timestamp.test.ts → timestamp_test.rb canonical schema port"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 500
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert `packages/activerecord/src/timestamp.test.ts` (~1011 LOC, 7 inline
tables) onto the canonical schema, matched to Rails.

- trails: `timestamp.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/timestamp_test.rb`

Rails drives `Developer`, `Pet`, `Owner`, `Toy` and `Topic` for
created_at/updated_at + `touch` cases — all canonical. The 7 inline tables are
scratch timestamp shapes; ride the canonical tables (which already carry the
timestamp columns).

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `timestamp_test.rb` FIRST; port each body word-for-word. Test names
      unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical `Developer`/`Pet`/`Owner`/`Toy`/`Topic`; rows via `fixtures` + `name(:label)` where Rails does.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/timestamp.test.ts` passes.

## Notes

- ~1011 LOC exceeds the ceiling: split across sibling PRs off `main` (NOT
  stacked). Ship what fits; register the remainder as a new story.

## Definition of done

Fidelity is the deliverable. An `eslint-disable` or leaving the file excluded
does **not** close this story.
