---
title: "relation.test.ts -> relation_test.rb canonical port"
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

Convert `packages/activerecord/src/relation.test.ts` (~1600 LOC, 9 inline
tables) onto the canonical schema, matched to Rails.

- trails: `relation.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/relation_test.rb`

Rails' `relation_test.rb` is mostly `Post`/`Comment`/`Author`/`FakeKlass`
unit-level Relation tests — all canonical. NOTE: this file also currently holds
trails-only describes (e.g. `isBlank`/`isPresent` smoke tests) with no Rails
counterpart; those keep their names but their schema must still ride
`TEST_SCHEMA` (fidelity step 4 does not apply to them — flag them in the PR).

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `relation_test.rb` FIRST; port each matching body word-for-word.
      Test names unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical models; rows via `fixtures` + `name(:label)` where Rails
      does. Trails-only describes ride canonical tables but are not held to a
      non-existent Rails body.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/relation.test.ts` passes.

## Notes

- ~1600 LOC exceeds the ceiling: split across sibling PRs off `main` (NOT
  stacked). Ship what fits; register the remainder as a new story.

## Definition of done

Fidelity is the deliverable for Rails-backed tests. An `eslint-disable` or
leaving the file excluded does **not** close this story.
