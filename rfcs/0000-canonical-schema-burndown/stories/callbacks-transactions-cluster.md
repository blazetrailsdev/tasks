---
title: "callbacks / transactions / locking → canonical schema + Rails fixtures"
status: draft
updated: 2026-06-09
rfc: "0000-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 500
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert the callbacks/transactions files (RFC §Rollout phase 2). `transactions`
and `callbacks` are large and touch shared `people`/`topics` tables — split
per-`describe`; depends on `shared-table-convergence`.

Files (remove each from the exclude JSON as it lands):

- `callbacks.test.ts` → `callbacks_test.rb` (split per-describe)
- `transaction-callbacks.test.ts` → `transaction_callbacks_test.rb`
- `transactions.test.ts` → `transactions_test.rb` (split per-describe)
- `custom-locking.test.ts` → `custom_locking_test.rb`
- `touch-later.test.ts` → `touch_later_test.rb`
- `counter-cache.test.ts` → `counter_cache_test.rb`
- `statement-cache.test.ts` → `statement_cache_test.rb`

## Acceptance criteria

- [ ] Each file rides `TEST_SCHEMA` + canonical models + `fixtures`/`name(:label)`
      lookups where Rails does.
- [ ] Each test body matches its Rails counterpart word-for-word; test names
      unchanged.
- [ ] `pnpm vitest run` passes (co-run colliding siblings under `maxForks=1`);
      zero `require-canonical-schema` errors; files removed from the exclude JSON.

## Notes

- `callbacks.test.ts` declares a `people:{name}` scratch shape (RFC Phase-1
  table); do not start until `shared-table-convergence` has handled `people`.
- Canonical models Topic/Chef/Iris have latent `this`-binding callback bugs
  (memory `assoc_callbacks_fixture_parity_blocked`) — a framework
  `cb.call(record, record)` fix may be a prerequisite for some bodies.
