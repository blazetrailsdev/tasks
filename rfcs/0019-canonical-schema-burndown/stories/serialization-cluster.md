---
title: "serialization + store cluster → canonical schema + Rails fixtures"
status: done
updated: 2026-06-10
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 350
priority: 6
pr: 3094
claim: "2026-06-10T18:55:22Z"
assignee: "serialization-cluster"
blocked-by: null
---

## Context

Convert the serialization files (RFC §Rollout phase 1).

Files (remove each from the exclude JSON as it lands):

- `serialization.test.ts` → `serialization_test.rb`
- `json-serialization.test.ts` → `json_serialization_test.rb`
- `serialized-attribute.test.ts` → `serialized_attribute_test.rb`
- `store.test.ts` → `store_test.rb`

## Acceptance criteria

- [ ] Each file rides `TEST_SCHEMA` + canonical models + `fixtures`/`name(:label)`
      lookups where Rails does.
- [ ] Each test body matches its Rails counterpart word-for-word; test names
      unchanged.
- [ ] `pnpm vitest run` passes; zero `require-canonical-schema` errors; files
      removed from the exclude JSON.
