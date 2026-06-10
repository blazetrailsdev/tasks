---
title: "relation/ mutation cluster → canonical schema + Rails fixtures"
status: done
updated: 2026-06-10
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 350
priority: 6
pr: 3092
claim: "2026-06-10T18:22:23Z"
assignee: "relation-mutation-cluster"
blocked-by: null
---

## Context

Convert the write/mutation + misc `relation/` files (RFC §Rollout phase 1).

Files (remove each from the exclude JSON as it lands):

- `relation/mutation.test.ts` → `relation/mutation_test.rb`
- `relation/update-all.test.ts` → `relation/update_all_test.rb`
- `relation/delete-all.test.ts` → `relation/delete_all_test.rb`
- `relation/delegation.test.ts` → `relation/delegation_test.rb`
- `relation/structural-compatibility.test.ts` → `relation_test.rb`
- `relation/thenable.test.ts` → `relation_test.rb`

## Acceptance criteria

- [ ] Each file rides `TEST_SCHEMA` + canonical models + `fixtures`/`name(:label)`
      lookups where Rails does.
- [ ] Each test body matches its Rails counterpart word-for-word; test names
      unchanged.
- [ ] `pnpm vitest run` passes; zero `require-canonical-schema` errors; files
      removed from the exclude JSON.

## Notes

- `relation/delegation.test.ts` is a backlog Tier-1 quick win (redundant
  `defineSchema` alongside existing `useFixtures`) — verify body fidelity anyway.
