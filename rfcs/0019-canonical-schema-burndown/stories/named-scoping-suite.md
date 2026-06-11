---
title: "named-scoping/ → canonical schema + Rails fixtures"
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

Convert `packages/activerecord/src/scoping/named-scoping.test.ts` (~1400 LOC,
7 inline tables) onto the canonical schema, matched to Rails.

- trails: `scoping/named-scoping.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/scoping/named_scoping_test.rb`

Rails drives `Topic`/`Reply`/`Post`/`Author`/`Comment` for `scope`,
default_scope, scope chaining and `scoping {}` — all canonical.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `named_scoping_test.rb` FIRST; port each body word-for-word. Test
      names unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical models with Rails `scope` declarations; rows via `fixtures` + `name(:label)` where Rails does.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/scoping/named-scoping.test.ts`
      passes.

## Notes

- ~1400 LOC: split per-describe across sibling PRs off `main` (NOT stacked).

## Definition of done

Fidelity is the deliverable. An `eslint-disable` or leaving the file excluded
does **not** close this story.
