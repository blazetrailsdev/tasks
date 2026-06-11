---
title: "defaults.test.ts → defaults_test.rb canonical schema port"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 350
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert `packages/activerecord/src/defaults.test.ts` (~431 LOC, 10 inline
tables) onto the canonical schema, matched to Rails.

- trails: `defaults.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/defaults_test.rb`

Rails drives `Default`, `Entry`, and adapter-specific default-value cases
against canonical tables. Several of the 10 inline tables exercise column
defaults that only exist on one adapter — keep those as adapter-gated, but ride
the canonical table where `schema.rb` already declares the default.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `defaults_test.rb` FIRST; port each body word-for-word. Test names
      unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical models; rows via `fixtures` + `name(:label)` where Rails
      does.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/defaults.test.ts` passes.

## Definition of done

Fidelity is the deliverable. An `eslint-disable` or leaving the file excluded
does **not** close this story.
