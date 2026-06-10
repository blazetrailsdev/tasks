---
title: "calculations + aggregations → canonical schema + Rails fixtures"
status: ready
updated: 2026-06-09
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 500
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert the calculation/aggregation files (RFC §Rollout phase 2).
`calculations.test.ts` is the largest file in the suite (~7240 LOC) — ship
per-`describe` across sibling PRs off `main`. Both touch shared tables
(`accounts`, `companies`, `people`), so they depend on
`shared-table-convergence`.

Files (remove each from the exclude JSON as it lands):

- `calculations.test.ts` → `calculations_test.rb` (split per-describe)
- `aggregations.test.ts` → `aggregations_test.rb`

## Acceptance criteria

- [ ] Each file rides `TEST_SCHEMA` + canonical models (Account, Company, …) +
      `fixtures`/`name(:label)` lookups where Rails does.
- [ ] Each test body matches its Rails counterpart word-for-word; test names
      unchanged.
- [ ] `pnpm vitest run` passes (co-run colliding siblings under `maxForks=1`);
      zero `require-canonical-schema` errors; files removed from the exclude JSON.

## Notes

- `calculations` and `aggregations` are backlog Tier-1 candidates with redundant
  `defineSchema` — but treat as full fidelity ports, not boilerplate trims.
- Multi-PR by necessity; register continuation stories with `pnpm tasks new`.
