---
title: "aggregations.test.ts — retire remaining non-Rails describes + drop exclude"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["calculations-aggregations"]
deps-rfc: []
est-loc: 250
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to `calculations-aggregations` (PR #3107), which converted the
`AggregationsTest` describe to the canonical Customer model + `customers`
fixtures. `aggregations.test.ts` still carries non-Rails invented describes that
use redundant `defineSchema`:

- `Aggregations` (should sum/average/minimum/maximum field, empty-relation cases)
- `Aggregation edge cases`
- `composed_of`
- `composed_of (Rails-guided)`

These have no `aggregations_test.rb` counterpart (the sum/avg/min/max ones belong
conceptually to calculations). Per the burndown's fidelity-first rule they should
be retired or moved to faithful Rails-matching homes, after which the file leaves
`defineSchema` behind entirely.

## Acceptance criteria

- [ ] Remove or relocate the non-Rails `Aggregations` / `composed_of` describes
      so `aggregations.test.ts` no longer calls `defineSchema`.
- [ ] `OverridingAggregationsTest` retained (it mirrors a real Rails test).
- [ ] Remove `aggregations.test.ts` from `eslint/require-canonical-schema-exclude.json`
      and `eslint/expected-fixtures-exclude.json`; eslint passes with zero
      `require-canonical-schema` errors.
- [ ] `pnpm vitest run packages/activerecord/src/aggregations.test.ts` passes.
