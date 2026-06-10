---
title: "attributes + type/precision cluster → canonical schema + Rails fixtures"
status: claimed
updated: 2026-06-10
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 450
priority: 6
pr: null
claim: "2026-06-10T21:09:34Z"
assignee: "attribute-types-cluster"
blocked-by: null
---

## Context

Convert the attribute/type/precision files (RFC §Rollout phase 1). Mostly
self-contained type tests with clean Rails counterparts.

Files (remove each from the exclude JSON as it lands):

- `attributes.test.ts` → `attributes_test.rb`
- `defaults.test.ts` → `defaults_test.rb`
- `date.test.ts` → `date_test.rb`
- `date-time-precision.test.ts` → `date_time_precision_test.rb`
- `time-precision.test.ts` → `time_precision_test.rb`
- `timestamp.test.ts` → `timestamp_test.rb`
- `bigint-roundtrip.test.ts` → no direct Rails counterpart (trails type-roundtrip test); convert schema/fixtures only, no body to match
- `normalized-attribute.test.ts` → `normalized_attribute_test.rb`

## Acceptance criteria

- [ ] Each file rides `TEST_SCHEMA` + canonical models + `fixtures`/`name(:label)`
      lookups where Rails does.
- [ ] Each test body matches its Rails counterpart word-for-word; test names
      unchanged.
- [ ] `pnpm vitest run` passes; zero `require-canonical-schema` errors; files
      removed from the exclude JSON.

## Notes

- `defaults.test.ts` declares an `items:{count}` scratch shape — a known member of
  the `items` collision group that `shared-table-convergence` converges. This story
  `deps` on it, so `items` is already converged before `defaults.test.ts` is
  touched; ride the canonical `items` table.
- Split across sibling PRs off `main` to stay ≤500 LOC.
