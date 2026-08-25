---
title: "association-scope.test.ts → canonical (rewrite resolver edge cases onto canonical STI/polymorphic tables)"
status: done
updated: 2026-06-26
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 400
priority: 58
pr: 4198
claim: "2026-06-26T15:09:40Z"
assignee: "association-scope-test-canonical"
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

Convert `packages/activerecord/src/associations/association-scope.test.ts`
(~1168 LOC, 24 inline tables) onto the canonical schema.

- trails: `associations/association-scope.test.ts`
- Rails: **no 1:1 counterpart** — trails-internal `AssociationScope` resolver
  harness covering STI, namespaced-polymorphic, composite-key and self-ref edge
  cases. Fidelity step 4 N/A; bar is steps 1–3.

Map each edge case to the canonical table that already models it: STI →
`Company`/`Firm`/`Client`; polymorphic → `Tagging`/`taggable`; self-ref → the
canonical self-join. Genuinely synthetic shapes (uuid-PK, namespaced
polymorphic with no `schema.rb` row) stay bespoke but **file-unique**, never the
shared name.

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
- [ ] No collisions with shared `posts`/`comments`/`users`/`companies` tables.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`
      (a genuinely un-canonical resolver shape may keep a scoped disable with a
      one-line reason — not as a shortcut).
- [ ] `pnpm vitest run packages/activerecord/src/associations/association-scope.test.ts`
      passes.

## Notes

- ~1168 LOC: split per-describe across sibling PRs off `main` (NOT stacked).
- This is part of the cluster that blocked PR #3121 (see
  `associations-scope-cache-cluster`): canonical-schema gaps must be filled
  first. Add any missing STI/polymorphic table to `test-schema.ts` (parity with
  `schema.rb`) as the enabling first PR.

## Definition of done

Rides canonical tables (or file-unique scratch where no analog exists) with no
shared-table collisions. Blanket `eslint-disable` does **not** close this story.
