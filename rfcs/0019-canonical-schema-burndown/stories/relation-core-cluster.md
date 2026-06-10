---
title: "relation / relations / querying core → canonical schema + Rails fixtures"
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

Convert the top-level relation/querying core files (RFC §Rollout phase 2).
`relations.test.ts` is large (~6917 LOC) — split per-`describe` across sibling
PRs off `main`. These touch shared tables (`posts`, `people`), so they depend on
`shared-table-convergence`.

Files (remove each from the exclude JSON as it lands):

- `relation.test.ts` → `relation_test.rb`
- `relations.test.ts` → `relations_test.rb` (split per-describe)
- `null-relation.test.ts` → `null_relation_test.rb`
- `excluding.test.ts` → `excluding_test.rb`
- `querying.test.ts` → `finder_test.rb`
- `querying-methods-delegation.test.ts` → `finder_test.rb` (delegation cases)
- `batches.test.ts` → `batches_test.rb`

## Acceptance criteria

- [ ] Each file rides `TEST_SCHEMA` + canonical models + `fixtures`/`name(:label)`
      lookups where Rails does.
- [ ] Each test body matches its Rails counterpart word-for-word; test names
      unchanged.
- [ ] `pnpm vitest run` passes (co-run colliding siblings under `maxForks=1`);
      zero `require-canonical-schema` errors; files removed from the exclude JSON.

## Notes

- `relations.test.ts` larger than one PR — ship per-`describe`, register the
  remainder as new stories under this RFC (`pnpm tasks new`), do not self-fan-out.
