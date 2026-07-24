---
title: "Restore canonical items table after its suite"
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

1 of 12 firings (postgres). Canonical `items`
(`packages/activerecord/src/test-helpers/test-schema.ts:860`) drifted; victim
was `associations/inverse-associations.test.ts`. Culprit candidates that
`defineSchema({ items: … })`: `readonly.test.ts`, `transactions.trails.test.ts`.

## Acceptance criteria

- Identify the culprit and make it restore the canonical `items` shape after it
  runs (or use transactional fixtures / a scratch table). Aligns with RFC 0059.
- Re-measured CI shows zero repair firings for `items`.
- Rails-faithful; no test renamed; `test:compare` delta >= 0.
