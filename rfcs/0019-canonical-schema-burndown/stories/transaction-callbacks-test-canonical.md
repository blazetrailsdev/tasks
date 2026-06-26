---
title: "transaction-callbacks.test.ts → canonical schema + Rails fixtures"
status: in-progress
updated: 2026-06-26
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 250
priority: 37
pr: 4179
claim: "2026-06-26T04:30:49Z"
assignee: "transaction-callbacks-test-canonical"
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

Convert `packages/activerecord/src/transaction-callbacks.test.ts` (~1284 LOC,
6 inline tables) onto the canonical schema, matched to Rails.

- trails: `transaction-callbacks.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/transaction_callbacks_test.rb`

Rails drives `TopicWithCallbacks`/`Reply`/`Owner`/`Pet` for
after_commit/after_rollback — all canonical. NOTE: deliberate-error tests that
intentionally raise inside a transaction need `usesTransaction: [...]` on the
fixtures wiring (see memory `pg_deliberate_error_tests_need_usestransaction`)
to avoid poisoning PG transactional-fixture teardown.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `transaction_callbacks_test.rb` FIRST; port each body word-for-word.
      Test names unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical models with the Rails commit/rollback callbacks; rows via
      `fixtures` + `name(:label)` where Rails does.
- [ ] Tests that intentionally raise use `usesTransaction` so PG teardown is
      not poisoned.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/transaction-callbacks.test.ts`
      passes (verify on PG, not just sqlite).

## Notes

- ~1284 LOC: split per-describe across sibling PRs off `main` (NOT stacked).

## Definition of done

Fidelity is the deliverable. An `eslint-disable` or leaving the file excluded
does **not** close this story.
