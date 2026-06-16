---
title: "bidirectional-destroy-dependencies → canonical fixtures (needs dependent-destroy cycle guard)"
status: draft
updated: 2026-06-16
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 120
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert `packages/activerecord/src/associations/bidirectional-destroy-dependencies.test.ts`
(~77 LOC, 2 inline tables) onto canonical fixtures. This story likely also needs
a small **implementation fix**: a `dependent: :destroy` cycle guard so two models
that destroy each other don't infinitely recurse.

- trails: `associations/bidirectional-destroy-dependencies.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations/bidirectional_destroy_dependencies_test.rb`

Rails drives `Content`/`ContentPosition` (mutually `dependent: :destroy`) and
asserts a single destroy pass — both canonical.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `bidirectional_destroy_dependencies_test.rb` FIRST; port each body
      word-for-word. Test names unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical `Content`/`ContentPosition`; rows via `fixtures` +
      `name(:label)` where Rails does.
- [ ] If the faithful body infinite-loops, add the destroy cycle guard to the
      dependent-destroy callback path — do NOT weaken the test. Cite the Rails
      `_already_destroyed?` / destroyed-flag mechanism in the PR.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/associations/bidirectional-destroy-dependencies.test.ts`
      passes.

## Definition of done

Fidelity is the deliverable; if the cycle guard is missing, fix the impl. An
`eslint-disable` or leaving the file excluded does **not** close this story.
