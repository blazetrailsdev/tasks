---
title: "association-scope-cache.test.ts → canonical (rewrite cache_* onto canonical authors/posts/comments)"
status: done
updated: 2026-06-25
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 150
priority: 17
pr: 4152
claim: "2026-06-25T21:02:15Z"
assignee: "association-scope-cache-test-canonical"
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

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
