---
title: "attributes + type/precision cluster → canonical schema + Rails fixtures"
status: in-progress
updated: 2026-06-10
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 450
priority: 6
pr: 3100
claim: "2026-06-10T21:09:34Z"
assignee: "attribute-types-cluster"
blocked-by: null
---

## Context

Convert the attribute/type/precision files (RFC §Rollout phase 1). Mostly
self-contained type tests with clean Rails counterparts.

**Scope narrowed** (2026-06-10): the 8-file cluster did not fit one ≤300 LOC
PR, so this story ships the small type/precision trio + the trails roundtrip
test, and the four heavy inline-class rewrites were carved into their own
follow-up stories rather than fanned out as sibling PRs (per CLAUDE.md).

This story (PR shipped) covers:

- `date.test.ts` → `date_test.rb`
- `date-time-precision.test.ts` → `date_time_precision_test.rb`
- `time-precision.test.ts` → `time_precision_test.rb`
- `bigint-roundtrip.test.ts` → no direct Rails counterpart (trails type-roundtrip test); convert schema/fixtures only, no body to match

Carved into follow-up stories:

- `attributes.test.ts` → `attributes-test-cluster`
- `defaults.test.ts` → `defaults-test-cluster`
- `timestamp.test.ts` → `timestamp-test-cluster`
- `normalized-attribute.test.ts` → `normalized-attribute-test-cluster`

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
