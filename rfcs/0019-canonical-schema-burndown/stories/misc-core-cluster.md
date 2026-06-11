---
title: "explain / strict-loading / suppressor / unsafe-raw-sql → canonical schema"
status: in-progress
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 350
priority: 7
pr: 3114
claim: "2026-06-11T02:12:48Z"
assignee: "misc-core-cluster"
blocked-by: null
---

## Context

Convert the remaining small core files (RFC §Rollout phase 2).

Files (remove each from the exclude JSON as it lands):

- `explain.test.ts` → `explain_test.rb`
- `strict-loading.test.ts` → `strict_loading_test.rb`
- `strict-loading-sync-reader.test.ts` → `strict_loading_test.rb`
- `suppressor.test.ts` → `suppressor_test.rb`
- `unsafe-raw-sql.test.ts` → `unsafe_raw_sql_test.rb`

## Acceptance criteria

- [ ] Each file rides `TEST_SCHEMA` + canonical models + `fixtures`/`name(:label)`
      lookups where Rails does.
- [ ] Each test body matches its Rails counterpart word-for-word; test names
      unchanged.
- [ ] `pnpm vitest run` passes; zero `require-canonical-schema` errors; files
      removed from the exclude JSON.

## Notes

- `suppressor.test.ts` is a backlog Tier-1 quick win — verify body fidelity anyway.
