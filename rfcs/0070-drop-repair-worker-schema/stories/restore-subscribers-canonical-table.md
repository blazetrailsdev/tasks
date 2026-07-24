---
title: "Restore canonical subscribers table after its suite"
status: ready
updated: 2026-07-24
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

1 of 12 firings (mysql). Canonical `subscribers`
(`packages/activerecord/src/test-helpers/test-schema.ts:1430`) drifted; victim
was `calculations.trails.test.ts`. Culprit candidates that `defineSchema`
`subscribers`: `adapter.test.ts`, `finder.test.ts`, `insert-all.test.ts`,
`associations/has-many-associations.test.ts`, `test-helpers/use-fixtures.test.ts`.

## Acceptance criteria

- Identify the culprit and make it restore the canonical `subscribers` shape
  after it runs (or use transactional fixtures / a scratch table). Aligns with
  RFC 0059.
- Re-measured CI shows zero repair firings for `subscribers`.
- Rails-faithful; no test renamed; `test:compare` delta >= 0.
