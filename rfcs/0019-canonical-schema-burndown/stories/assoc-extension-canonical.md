---
title: "extension.test.ts → canonical schema (posts-collision)"
status: done
updated: 2026-06-26
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 250
priority: 34
pr: 4177
claim: "2026-06-26T03:39:47Z"
assignee: "assoc-extension-canonical"
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

Convert `packages/activerecord/src/associations/extension.test.ts` (~238 LOC, **4 inline tables**)
onto the canonical schema, matched to Rails.

- trails: `associations/extension.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations/extension_test.rb`

Rails drives `Post`/`Comment`/`Author`/`Project`/`Developer` association extension modules — all canonical. The inline tables are per-test scratch
shapes; collapse onto the canonical association tables or rename file-unique
where a column has no `schema.rb` analog.

This file defines `posts` with a `body` column while ~14 sibling files define
`posts` title-only — the documented `posts` shared-DB flake (memory
`posts_table_shared_db_flake`). Riding the canonical `posts` table is the fix;
do NOT keep a divergent inline `posts`.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `associations/extension_test.rb` FIRST; port each body word-for-word. Test names unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Replace bespoke models with the canonical registry models (`Post`/`Comment`/`Author`/`Project`/`Developer` association extension modules) and
      their Rails associations; rows via `fixtures` + `name(:label)` where Rails
      does.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/associations/extension.test.ts` passes (co-run colliding
      siblings under `maxForks=1`).

## Definition of done

A PR that swaps the schema but leaves bodies diverging from Rails is **not
done** — fidelity is the deliverable. An `eslint-disable` or leaving the file in
the exclude JSON does **not** close this story.
