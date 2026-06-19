---
title: "persistence / dup / clone / insert-all → canonical schema + Rails fixtures"
status: ready
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 450
priority: 7
pr: null
claim: null
blocked-by: null
---

## Context

Convert the persistence/dup/clone/insert-all cluster onto the canonical schema,
matched to Rails. Each is a distinct Rails source file:

- `persistence.test.ts` (~4589 LOC, 23 tbl) → `persistence_test.rb`
- `dup.test.ts` (~220 LOC, 4 tbl) → `dup_test.rb`
- `clone.test.ts` (~140 LOC, 3 tbl) → `clone_test.rb`
- `insert-all.test.ts` (~1375 LOC, 21 tbl) → `insert_all_test.rb`

All drive `Topic`/`Post`/`Author`/`Book`/`Developer` — canonical. (Confirm each
is still in the exclude JSON at claim time.)

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open each Rails counterpart FIRST; port each body word-for-word. Test
      names unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical models; rows via `fixtures` + `name(:label)` where Rails
      does. `insert_all` upsert tests must reproduce the real unique index from
      `schema.rb`, not a scratch one.
- [ ] Each file removed from the exclude JSON; `pnpm lint` clean, no
      `eslint-disable`.
- [ ] `pnpm vitest run <each file>` passes.

## Notes

- `persistence.test.ts` alone is ~4589 LOC: ship it per-describe across sibling
  PRs off `main` (NOT stacked). The smaller files can each be a single PR.
  Register remaining persistence waves as new stories — do not fan out yourself.

## Definition of done

Fidelity is the deliverable. An `eslint-disable` or leaving a file excluded
does **not** close this story.
