---
title: "habtm + has-and-belongs-to-many → canonical schema (split)"
status: claimed
updated: 2026-06-16
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 500
priority: 1
pr: null
claim: "2026-06-16T14:31:40Z"
assignee: "assoc-habtm-canonical"
blocked-by: null
---

## Context

Convert the HABTM pair onto the canonical schema.

- `associations/has-and-belongs-to-many-associations.test.ts` (~1910 LOC, 28
  tbl) → `associations/has_and_belongs_to_many_associations_test.rb`
- `associations/habtm.test.ts` (~98 LOC, 6 tbl) — trails-internal HABTM harness,
  no 1:1 Rails counterpart (fidelity step 4 N/A; ride canonical schema + the
  canonical join table only).

Rails drives `Developer`/`Project`/`Category`/`Post` over the
`developers_projects` / `categories_posts` join tables — all canonical. The
join-table scratch shapes are a known collision surface; depend on
`habtm-join-table-convergence` if claimed after it lands.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `has_and_belongs_to_many_associations_test.rb` FIRST; port each body
      word-for-word. Test names unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical `Developer`/`Project`/`Category`/`Post` with
      `has_and_belongs_to_many`; rows via `fixtures` + `name(:label)` where Rails
      does. The internal `habtm.test.ts` rides canonical tables but is not held
      to a non-existent Rails body.
- [ ] Both files removed from the exclude JSON; `pnpm lint` clean, no
      `eslint-disable`.
- [ ] `pnpm vitest run <each file>` passes.

## Notes

- ~1910 LOC: split per-describe across sibling PRs off `main` (NOT stacked).

## Definition of done

Fidelity is the deliverable for the Rails-backed file. An `eslint-disable` or
leaving a file excluded does **not** close this story.
