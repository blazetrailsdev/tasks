---
title: "collection-cache-key.test.ts → collection_cache_key_test.rb canonical port"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 200
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Coverage-gap story: `packages/activerecord/src/collection-cache-key.test.ts`
(~288 LOC, 1 inline table) is on the exclude list with **no owning story**.
Convert it onto the canonical schema, matched to Rails.

- trails: `collection-cache-key.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/collection_cache_key_test.rb`

Rails drives `Developer`/`Comment`/`Post` for `cache_key` / `cache_version` over
a relation — all canonical.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `collection_cache_key_test.rb` FIRST; port each body word-for-word.
      Test names unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical `Developer`/`Comment`/`Post`; rows via `fixtures` +
      `name(:label)` where Rails does.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/collection-cache-key.test.ts`
      passes.

## Definition of done

Fidelity is the deliverable. An `eslint-disable` or leaving the file excluded
does **not** close this story.
