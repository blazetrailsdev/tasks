---
title: "excluding.test.ts -> excluding_test.rb canonical port"
status: claimed
updated: 2026-06-26
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 200
priority: 23
pr: null
claim: "2026-06-26T00:17:15Z"
assignee: "excluding-test-canonical"
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

Convert `packages/activerecord/src/excluding.test.ts` (~223 LOC, 2 inline
tables) onto the canonical schema, matched to Rails.

- trails: `excluding.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/excluding_test.rb`

Rails drives `Post`/`Comment` for `excluding`/`without` — both canonical. Ride
the canonical tables.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `excluding_test.rb` FIRST; port each body word-for-word. Test names
      unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical `Post`/`Comment`; rows via `fixtures` + `name(:label)` where
      Rails does.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/excluding.test.ts` passes.

## Definition of done

Fidelity is the deliverable. An `eslint-disable` or leaving the file excluded
does **not** close this story.
