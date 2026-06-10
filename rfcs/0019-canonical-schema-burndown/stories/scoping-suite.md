---
title: "scoping/ suite → canonical schema + Rails fixtures"
status: claimed
updated: 2026-06-10
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 300
priority: 6
pr: null
claim: "2026-06-10T23:47:14Z"
assignee: "scoping-suite"
blocked-by: null
---

## Context

Convert the `scoping/` files (RFC §Rollout phase 1). `named-scoping` touches the
shared `posts` table, so this depends on `shared-table-convergence`.

Files (remove each from the exclude JSON as it lands):

- `scoping/default-scoping.test.ts` → `scoping/default_scoping_test.rb`
- `scoping/named-scoping.test.ts` → `scoping/named_scoping_test.rb`
- `scoping/relation-scoping.test.ts` → `scoping/relation_scoping_test.rb`

## Acceptance criteria

- [ ] Each file rides `TEST_SCHEMA` + canonical models + `fixtures`/`name(:label)`
      lookups where Rails does.
- [ ] Each test body matches its Rails counterpart word-for-word; test names
      unchanged.
- [ ] `pnpm vitest run` passes (co-run the `posts` sibling under `maxForks=1` for
      `named-scoping`); zero `require-canonical-schema` errors; files removed from
      the exclude JSON.

## Notes

- `named-scoping` is a documented `posts`-collision file; do not start until
  `shared-table-convergence` has converged `posts`.
