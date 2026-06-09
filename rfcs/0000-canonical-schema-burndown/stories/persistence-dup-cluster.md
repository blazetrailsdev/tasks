---
title: "persistence / dup / clone / insert-all → canonical schema + Rails fixtures"
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

Convert the persistence/clone files (RFC §Rollout phase 2). `persistence.test.ts`
is large — split per-`describe` across sibling PRs off `main`.

Files (remove each from the exclude JSON as it lands):

- `persistence.test.ts` → `persistence_test.rb` (split per-describe)
- `dup.test.ts` → `dup_test.rb`
- `clone.test.ts` → `dup_test.rb` (clone cases)
- `collection-cache-key.test.ts` → `collection_cache_key_test.rb`
- `insert-all.test.ts` → `insert_all_test.rb`

## Acceptance criteria

- [ ] Each file rides `TEST_SCHEMA` + canonical models + `fixtures`/`name(:label)`
      lookups where Rails does.
- [ ] Each test body matches its Rails counterpart word-for-word; test names
      unchanged.
- [ ] `pnpm vitest run` passes; zero `require-canonical-schema` errors; files
      removed from the exclude JSON.

## Notes

- `clone.test.ts` is a backlog Tier-1 quick win — verify body fidelity anyway.
