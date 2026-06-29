---
title: "relation/where.test.ts → canonical schema + where_test.rb/relations_test.rb"
status: in-progress
updated: 2026-06-29
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence", "where-extra-burndown"]
deps-rfc: []
est-loc: 300
priority: 1
pr: 4277
claim: "2026-06-29T14:42:54Z"
assignee: "relation-where-core"
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

Convert `packages/activerecord/src/relation/where.test.ts` (~2725 LOC, **53
inline tables**) onto the canonical schema, matched to Rails.

- trails: `relation/where.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/relation/where_test.rb`
  (+ the `where`-related cases in `relations_test.rb`)

This file mixes canonical and inline `people`/`posts` tables today (a named RFC
motivation). `deps: shared-table-convergence` guarantees the scratch shapes are
converged first, so ride the canonical `people`/`posts`/`authors`/`comments`
tables — no ad-hoc rename needed here.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `where_test.rb` FIRST; port each body word-for-word. Test names
      unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical models; rows via `fixtures` + `name(:label)` where Rails
      does.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/relation/where.test.ts` passes
      (co-run colliding siblings under `maxForks=1`).

## Notes

- ~2725 LOC with 53 tables: this is multi-PR. Split per-describe across sibling
  PRs off `main` (NOT stacked). Ship what fits; register the remainder as a new
  story — do not fan out yourself.

## Definition of done

Fidelity is the deliverable. An `eslint-disable` or leaving the file excluded
does **not** close this story.
