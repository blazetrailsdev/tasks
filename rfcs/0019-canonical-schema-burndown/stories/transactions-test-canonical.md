---
title: "transactions.test.ts → canonical schema (split per-describe)"
status: ready
updated: 2026-06-25
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 300
priority: 53
pr: null
claim: null
assignee: null
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

Convert `packages/activerecord/src/transactions.test.ts` (~2701 LOC, 5 inline
tables) onto the canonical schema, matched to Rails.

- trails: `transactions.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/transactions_test.rb`

Rails drives `Topic`/`Reply`/`Developer`/`Author` for nested transactions,
savepoints, rollback semantics — all canonical. As with transaction-callbacks,
deliberate-error tests need `usesTransaction: [...]` so PG teardown survives.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire each describe with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `transactions_test.rb` FIRST; port each body word-for-word. Test
      names unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical models; rows via `fixtures` + `name(:label)` where Rails
      does. Intentional-raise tests use `usesTransaction`.
- [ ] File removed from the exclude JSON ONLY in the final PR, after the whole
      file lint-passes with no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/transactions.test.ts` passes
      (verify on PG).

## Notes

- ~2701 LOC: many sibling PRs off `main` (non-overlapping describes, NOT
  stacked). Register each wave as a new story.

## Definition of done

Fidelity is the deliverable. An `eslint-disable` or leaving the file excluded
does **not** close this story.
