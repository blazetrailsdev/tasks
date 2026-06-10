---
title: "store_test.rb → canonical Admin::User + fixtures"
status: draft
updated: 2026-06-10
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 400
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Split out of the original `serialization-cluster` story (which shipped only `serialization.test.ts`). `store.test.ts` (1123 LOC) → `store_test.rb`. Rails uses `Admin::User` with `store :settings`/`store :preferences`; current TS uses inline `users` models. Large; likely needs splitting under the 300-LOC ceiling. Remove the file from `eslint/require-canonical-schema-exclude.json` when done.

## Acceptance criteria

- [ ] Rides `TEST_SCHEMA` + canonical models + `fixtures`/`name(:label)` lookups.
- [ ] Test bodies match the Rails counterpart word-for-word; names unchanged.
- [ ] `pnpm vitest run` passes; zero `require-canonical-schema` errors; removed from exclude JSON.
