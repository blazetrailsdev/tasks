---
title: "relation/ select + order cluster → canonical schema + Rails fixtures"
status: in-progress
updated: 2026-06-10
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 400
priority: 6
pr: 3093
claim: "2026-06-10T18:33:23Z"
assignee: "relation-select-order-cluster"
blocked-by: null
---

## Context

Convert the select/order/projection `relation/` files (RFC §Rollout phase 1).

**Re-scoped (2026-06-10):** every file in this cluster edits the shared
`eslint/require-canonical-schema-exclude.json`, so they cannot ship as parallel
sibling PRs (exclude-list conflicts). This story now covers only the two
mechanically-clean files shipped in **PR #3093**; the four substantive faithful
Rails ports are carved into their own sequential stories:

- `relation-select-test-canonical` — `select.test.ts` → `select_test.rb`
- `relation-order-test-canonical` — `order.test.ts` → `order_test.rb`
- `relation-with-test-canonical` — `with.test.ts` → `with_test.rb`
- `relation-field-ordered-values-canonical` — `field-ordered-values.test.ts`
  → `field_ordered_values_test.rb`

### Done in this story (PR #3093)

- `relation/annotations.test.ts` → **deleted** (redundant; `annotate_test.rb` is
  already faithfully ported in `src/annotate.test.ts`, 2/2 matched). Removed from
  the exclude JSON.
- `relation/select-star-join-collision.test.ts` → synthetic regression tables
  kept inline behind the rule's `eslint-disable` escape hatch (no canonical-table
  equivalent). Removed from the exclude JSON.

## Acceptance criteria

- [x] `annotations.test.ts` resolved (deleted; Rails parity preserved via
      `annotate.test.ts`).
- [x] `select-star-join-collision.test.ts` resolved (eslint-disable; 3/3 pass).
- [x] Both removed from the exclude JSON; 0 `require-canonical-schema` errors;
      `test:compare` delta = 0 (annotate_test.rb still 2/2).

## Notes

- Mark `done` against PR #3093 once it merges. The four carved-out ports proceed
  sequentially off `main`, one at a time, because of the shared exclude JSON.
