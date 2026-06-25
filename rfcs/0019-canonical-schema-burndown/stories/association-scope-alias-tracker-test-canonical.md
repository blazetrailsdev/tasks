---
title: "association-scope-alias-tracker.test.ts → canonical (self-ref off synthetic at_users)"
status: ready
updated: 2026-06-25
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 120
priority: 9
pr: null
claim: null
assignee: null
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

Convert `packages/activerecord/src/associations/association-scope-alias-tracker.test.ts`
(~145 LOC, 1 inline table) off its synthetic self-referential `at_users` table.

- trails: `associations/association-scope-alias-tracker.test.ts`
- Rails: **no 1:1 counterpart** — this is a trails-internal alias-tracker /
  table-aliasing harness. Fidelity step 4 N/A; bar is steps 1–3.

The self-referential shape (`at_users` referencing itself) mirrors a canonical
self-join the schema already has — e.g. `Employee belongs_to :manager` or
`Category` parent/child. Rewrite onto that canonical self-ref instead of
`at_users`. If no canonical self-join fits, keep ONE file-unique scratch table
(not the shared `users`).

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] No collision with the shared `users` table. Test names unchanged.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/associations/association-scope-alias-tracker.test.ts`
      passes.

## Definition of done

No collision-prone synthetic table; rides canonical or a file-unique scratch.
An `eslint-disable` or leaving the file excluded does **not** close this story.
