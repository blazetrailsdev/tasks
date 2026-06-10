---
title: "relation/ select + order cluster → canonical schema + Rails fixtures"
status: claimed
updated: 2026-06-10
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 400
priority: 6
pr: null
claim: "2026-06-10T18:33:23Z"
assignee: "relation-select-order-cluster"
blocked-by: null
---

## Context

Convert the select/order/projection `relation/` files (RFC §Rollout phase 1).

Files (remove each from the exclude JSON as it lands):

- `relation/select.test.ts` → `relation/select_test.rb`
- `relation/select-star-join-collision.test.ts` → `relation/select_test.rb`
- `relation/order.test.ts` → `relation/order_test.rb`
- `relation/field-ordered-values.test.ts` → `relation/order_test.rb` (field-ordered)
- `relation/with.test.ts` → `relation/with_test.rb`
- `relation/annotations.test.ts` → `annotate_test.rb`

## Acceptance criteria

- [ ] Each file rides `TEST_SCHEMA` + canonical models + `fixtures`/`name(:label)`
      lookups where Rails does.
- [ ] Each test body matches its Rails counterpart word-for-word; test names
      unchanged.
- [ ] `pnpm vitest run` passes; zero `require-canonical-schema` errors; files
      removed from the exclude JSON.

## Notes

- Split across sibling PRs off `main` to stay ≤500 LOC.
