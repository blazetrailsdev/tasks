---
title: "store_test.rb → canonical Admin::User + fixtures"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 400
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert `packages/activerecord/src/store.test.ts` (~1124 LOC, 3 inline tables)
onto the canonical schema, matched to Rails.

- trails: `store.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/store_test.rb`

Rails drives `Admin::User` (`admin_users`, with `store`/`store_accessor` on a
`settings`/`preferences` text+json column) — canonical and already in
`TEST_SCHEMA`. Replace the inline tables and bespoke class with the registry
`Admin::User`.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `store_test.rb` FIRST; port each body word-for-word. Test names
      unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical `Admin::User` with `store_accessor`; rows via `fixtures` +
      `name(:label)` where Rails does.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/store.test.ts` passes.

## Notes

- ~1124 LOC exceeds the 500-LOC ceiling: split across sibling PRs off `main`
  (NOT stacked). Ship what fits; register the remainder as a new story — do not
  fan out yourself.

## Definition of done

Fidelity is the deliverable. An `eslint-disable` or leaving the file excluded
does **not** close this story.
