---
title: "touch-later.test.ts → canonical Topic/Owner/Pet + fixtures"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 200
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert `packages/activerecord/src/touch-later.test.ts` (~188 LOC, 1 inline
table) onto the canonical schema, matched to Rails.

- trails: `touch-later.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/touch_later_test.rb`

Rails drives `Owner`/`Pet`/`Topic` for `touch_later` deferred-touch within a
transaction — all canonical.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `touch_later_test.rb` FIRST; port each body word-for-word. Test
      names unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical `Owner`/`Pet`/`Topic`; rows via `fixtures` + `name(:label)`
      where Rails does.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/touch-later.test.ts` passes.

## Definition of done

Fidelity is the deliverable. An `eslint-disable` or leaving the file excluded
does **not** close this story.
