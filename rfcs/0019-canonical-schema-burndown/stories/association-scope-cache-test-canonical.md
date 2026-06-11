---
title: "association-scope-cache.test.ts → canonical (rewrite cache_* onto canonical authors/posts/comments)"
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

Convert `packages/activerecord/src/associations/association-scope-cache.test.ts`
(~171 LOC, 3 inline tables) off its `cache_*` synthetic tables.

- trails: `associations/association-scope-cache.test.ts`
- Rails: **no 1:1 counterpart** — trails-internal scope-cache harness. Fidelity
  step 4 N/A; bar is steps 1–3.

The `cache_authors`/`cache_posts`/`cache_comments` names are collision-avoidance
gensyms for the canonical `Author has_many :posts has_many :comments`. Rewrite
straight onto canonical `Author`/`Post`/`Comment`.

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
      `name(:label)`.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/associations/association-scope-cache.test.ts`
      passes.

## Definition of done

Rides canonical authors/posts/comments with no `cache_*` collision tables. An
`eslint-disable` or leaving the file excluded does **not** close this story.
