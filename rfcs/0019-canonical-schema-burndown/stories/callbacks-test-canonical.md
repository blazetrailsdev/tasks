---
title: "callbacks.test.ts → canonical schema + Rails fixtures (split per-describe)"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 300
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert `packages/activerecord/src/callbacks.test.ts` (~1729 LOC, 23 inline
tables) onto the canonical schema, matched to Rails.

- trails: `callbacks.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/callbacks_test.rb`

Rails drives `CallbackDeveloper`/`Topic`/`Reply`/`Person` with the full
before/after/around lifecycle — all canonical. NOTE: a sibling file
`associations/callbacks.test.ts` covers association callbacks separately; this
story owns the top-level `callbacks.test.ts` only.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `callbacks_test.rb` FIRST; port each body word-for-word. Test names
      unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical models + Rails callback declarations; rows via `fixtures` +
      `name(:label)` where Rails does.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/callbacks.test.ts` passes.

## Notes

- ~1729 LOC: split per-describe across sibling PRs off `main` (NOT stacked).

## Definition of done

Fidelity is the deliverable. An `eslint-disable` or leaving the file excluded
does **not** close this story.
