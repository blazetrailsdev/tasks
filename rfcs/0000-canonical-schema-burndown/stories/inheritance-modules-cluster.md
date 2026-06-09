---
title: "inheritance / modules / reflection → canonical schema + Rails fixtures"
status: draft
updated: 2026-06-09
rfc: "0000-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 450
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert the inheritance/STI/reflection files (RFC §Rollout phase 2).
`reflection.test.ts` is large — split per-`describe` across sibling PRs.

Files (remove each from the exclude JSON as it lands):

- `inheritance.test.ts` → `inheritance_test.rb`
- `inherited.test.ts` → `inheritance_test.rb` (inherited-callback cases)
- `modules.test.ts` → `modules_test.rb`
- `delegated-type.test.ts` → `delegated_type_test.rb`
- `reflection.test.ts` → `reflection_test.rb` (split per-describe)

## Acceptance criteria

- [ ] Each file rides `TEST_SCHEMA` + canonical models + `fixtures`/`name(:label)`
      lookups where Rails does.
- [ ] Each test body matches its Rails counterpart word-for-word; test names
      unchanged.
- [ ] `pnpm vitest run` passes; zero `require-canonical-schema` errors; files
      removed from the exclude JSON.

## Notes

- `reflection.test.ts` declares a `people:{name,age,active}` scratch shape — rename
  or rely on `shared-table-convergence` if the body needs those columns.
