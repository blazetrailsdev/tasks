---
title: "inverse-associations.test.ts → canonical Human/Face/Interest fixtures"
status: claimed
updated: 2026-06-16
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 400
priority: 2
pr: null
claim: "2026-06-16T15:34:14Z"
assignee: "inverse-associations-fixture-port"
blocked-by: null
---

## Context

Convert `packages/activerecord/src/associations/inverse-associations.test.ts`
(~2078 LOC, 20 inline tables) onto the canonical schema, matched to Rails.

- trails: `associations/inverse-associations.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations/inverse_associations_test.rb`

Rails drives `Human`/`Face`/`Interest` (plus `Man`→`Human` rename history) for
`inverse_of` two-way association integrity — all canonical
(`humans`/`faces`/`interests` in `schema.rb`).

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `inverse_associations_test.rb` FIRST; port each body word-for-word.
      Test names unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical `Human`/`Face`/`Interest` with `inverse_of`; rows via
      `fixtures` + `name(:label)` where Rails does.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/associations/inverse-associations.test.ts`
      passes.

## Notes

- ~2078 LOC: split per-describe across sibling PRs off `main` (NOT stacked).

## Definition of done

Fidelity is the deliverable. An `eslint-disable` or leaving the file excluded
does **not** close this story.
