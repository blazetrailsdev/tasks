---
title: "relation/ where + predicate cluster → canonical schema + Rails fixtures"
status: draft
updated: 2026-06-09
rfc: "0000-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 450
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert the where/predicate-building `relation/` files (RFC §Rollout phase 1).
These map to Rails `activerecord/test/cases/relation/*_test.rb` and the top-level
`where_test.rb` family.

Files (remove each from the exclude JSON as it lands):

- `relation/where.test.ts` → `relation/where_test.rb` (+ `relations_test.rb`)
- `relation/where-chain.test.ts` → `relation/where_chain_test.rb`
- `relation/composite-where.test.ts` → `relation/where_test.rb` (composite-key cases)
- `relation/predicate-builder.test.ts` → `relation/predicate_builder_test.rb`
- `relation/and.test.ts` → `relation/and_test.rb`
- `relation/or.test.ts` → `relation/or_test.rb`
- `relation/merging.test.ts` → `relation/merging_test.rb`

## Acceptance criteria

- [ ] Each file rides `TEST_SCHEMA` + canonical models + `fixtures`/`name(:label)`
      lookups where Rails does.
- [ ] Each test body matches its Rails counterpart word-for-word; test names
      unchanged.
- [ ] `pnpm vitest run` passes; zero `require-canonical-schema` errors; files
      removed from the exclude JSON.

## Notes

- `relation/where.test.ts` mixes canonical and inline `people` tables today (RFC
  motivation); `deps: shared-table-convergence` guarantees the `people` scratch
  shape is already converged before this story starts, so ride the canonical
  `people` table — no ad-hoc rename needed here.
- Split across sibling PRs off `main` to stay ≤500 LOC.
