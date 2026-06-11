---
title: "relation/merging.test.ts → canonical schema + merging_test.rb"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 250
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert `packages/activerecord/src/relation/merging.test.ts` (~593 LOC, 3 inline
tables) onto the canonical schema, matched to Rails.

- trails: `relation/merging.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/relation/merging_test.rb`

Rails drives `Post`/`Author`/`Comment`/`Developer` for `Relation#merge` — all
canonical. Ride the canonical `posts`/`authors`/`comments` tables; `deps:
shared-table-convergence` guarantees those shapes are converged before this
starts.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `merging_test.rb` FIRST; port each body word-for-word. Test names
      unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical `Post`/`Author`/`Comment`/`Developer`; rows via `fixtures` +
      `name(:label)` where Rails does.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/relation/merging.test.ts` passes.

## Notes

- Companion impl story `relation-merge-hash-and-proc-fidelity` fixes two
  `Relation#merge` bugs (hash-dispatch + proc-arg). If a ported Rails test fails
  on those bugs, fix the implementation — never rename the test or skip it.

## Definition of done

Fidelity is the deliverable. An `eslint-disable` or leaving the file excluded
does **not** close this story.
