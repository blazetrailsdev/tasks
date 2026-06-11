---
title: "association-relation.test.ts → canonical (rewrite off synthetic ar_blogs/ar_posts)"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 150
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert `packages/activerecord/src/associations/association-relation.test.ts`
(~197 LOC, 8 inline tables) off its synthetic `ar_blogs`/`ar_posts` scratch
tables onto the canonical schema.

- trails: `associations/association-relation.test.ts`
- Rails: **no 1:1 counterpart** — `AssociationRelation` behaviour lives across
  `relations_test.rb` / `has_many_associations_test.rb`. Fidelity step 4 N/A;
  the bar is steps 1–3.

The `ar_blogs`/`ar_posts` synthetic names exist only to dodge collisions; the
underlying shape is `Author has_many :posts`. Rewrite onto canonical
`Author`/`Post`/`Comment`. A `blogs`/`published` column that the canonical
schema lacks but `schema.rb` does NOT have → keep on a file-unique table.

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
- [ ] Use canonical `Author`/`Post`/`Comment`; rows via `fixtures` +
      `name(:label)`. Test names unchanged.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/associations/association-relation.test.ts`
      passes.

## Definition of done

Riding the canonical schema with no synthetic collision tables. An
`eslint-disable` or leaving the file excluded does **not** close this story.
