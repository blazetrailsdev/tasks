---
title: "counter-cache.test.ts → canonical schema + Rails fixtures"
status: done
updated: 2026-06-26
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence", "counter-cache-extra-burndown"]
deps-rfc: []
est-loc: 300
priority: 47
pr: 4189
claim: "2026-06-26T12:29:40Z"
assignee: "counter-cache-test-canonical"
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

Convert `packages/activerecord/src/counter-cache.test.ts` (~2436 LOC, 24 inline
tables) onto the canonical schema, matched to Rails.

- trails: `counter-cache.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/counter_cache_test.rb`

Rails drives `Topic`/`Reply`/`Car`/`Wheel`/`Post`/`Comment` with
`counter_cache: true` columns (`replies_count`, `wheels_count`, …) — all
canonical, and the counter columns already exist in `schema.rb`.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `counter_cache_test.rb` FIRST; port each body word-for-word. Test
      names unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical models with `counter_cache`; rows via `fixtures` +
      `name(:label)` where Rails does.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/counter-cache.test.ts` passes.

## Notes

- ~2436 LOC: split per-describe across sibling PRs off `main` (NOT stacked).

## Definition of done

Fidelity is the deliverable. An `eslint-disable` or leaving the file excluded
does **not** close this story.
