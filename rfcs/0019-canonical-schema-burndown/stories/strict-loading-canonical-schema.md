---
title: "strict-loading.test.ts + strict-loading-sync-reader.test.ts → canonical schema"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 400
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert the strict-loading pair onto the canonical schema.

- `strict-loading.test.ts` (~2473 LOC, **120 inline tables**) →
  `vendor/rails/activerecord/test/cases/strict_loading_test.rb`
- `strict-loading-sync-reader.test.ts` (~214 LOC, 4 tbl) — trails-internal sync
  reader harness, no Rails counterpart (fidelity step 4 N/A; ride canonical
  schema + fixtures only).

Rails drives `Developer`/`AuditLog`/`Ship`/`Post`/`Author` strict-loading via
`has_many … strict_loading` — all canonical. The 120 inline tables in the main
file are a major collision surface; collapse onto canonical association tables
or rename file-unique where no `schema.rb` analog exists.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `strict_loading_test.rb` FIRST; port each body word-for-word. Test
      names unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical models with `strict_loading`; rows via `fixtures` +
      `name(:label)` where Rails does. The sync-reader file rides canonical
      tables but is not held to a non-existent Rails body.
- [ ] Both files removed from the exclude JSON; `pnpm lint` clean, no
      `eslint-disable`.
- [ ] `pnpm vitest run <each file>` passes.

## Notes

- The main file (~2473 LOC, 120 tables) is multi-PR: split per-describe across
  sibling PRs off `main` (NOT stacked). Register each wave as a new story.

## Definition of done

Fidelity is the deliverable for Rails-backed tests. An `eslint-disable` or
leaving a file excluded does **not** close this story.
