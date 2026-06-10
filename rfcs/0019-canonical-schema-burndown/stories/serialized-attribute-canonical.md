---
title: "serialized_attribute_test.rb → canonical models + fixtures"
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

Split out of the original `serialization-cluster` story (which shipped only `serialization.test.ts`). `serialized-attribute.test.ts` (991 LOC) → `serialized_attribute_test.rb`. Heavy TS-ified bodies using non-canonical `users`/`parents`/synthetic `posts` tables; faithful port onto canonical models is large (likely needs splitting under the 300-LOC ceiling). Remove the file from `eslint/require-canonical-schema-exclude.json` when done.

## Acceptance criteria

- [ ] Rides `TEST_SCHEMA` + canonical models + `fixtures`/`name(:label)` lookups.
- [ ] Test bodies match the Rails counterpart word-for-word; names unchanged.
- [ ] `pnpm vitest run` passes; zero `require-canonical-schema` errors; removed from exclude JSON.
