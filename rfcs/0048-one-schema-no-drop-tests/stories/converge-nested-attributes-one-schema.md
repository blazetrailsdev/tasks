---
title: "converge-nested-attributes-one-schema"
status: ready
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Split off from `converge-persistence-validations-one-schema` (RFC 0048). PR #4317
converged `validations.test.ts`; this story covers `nested-attributes.test.ts`
(~2400 lines), which still declares a bespoke `defineSchema(TEST_SCHEMA)` (top of
file, ~line 43) used by ~20 describe blocks. One-schema mode needs it on canonical
`TEST_SCHEMA` tables.

## Acceptance criteria

- Convert `packages/activerecord/src/nested-attributes.test.ts` to canonical
  `TEST_SCHEMA` tables/columns + official fixtures/models; no bespoke tables, no
  invented columns. Match Rails table/column names exactly.
- Passes under `AR_ONE_SCHEMA=1` on sqlite, postgres, and maria.
- Test names match Rails verbatim. Likely needs splitting across multiple <500-LOC
  PRs (one describe-cluster per PR); register additional stories rather than fan out.
