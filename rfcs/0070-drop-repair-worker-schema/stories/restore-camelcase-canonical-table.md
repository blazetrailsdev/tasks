---
title: "Restore canonical CamelCase table after schema-dumper.test.ts"
status: draft
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

1 of 12 firings (postgres). Canonical `CamelCase` table
(`packages/activerecord/src/test-helpers/test-schema.ts`, key `CamelCase`)
drifted; victim was `adapters/postgresql/uuid.test.ts`. Culprit:
`schema-dumper.test.ts` `defineSchema({ CamelCase: … })` without restoring.

## Acceptance criteria

- Culprit restores the canonical `CamelCase` shape after it runs (or uses
  transactional fixtures / a scratch table). Aligns with RFC 0059.
- Re-measured CI shows zero repair firings for `CamelCase`.
- Rails-faithful; no test renamed; `test:compare` delta >= 0.
