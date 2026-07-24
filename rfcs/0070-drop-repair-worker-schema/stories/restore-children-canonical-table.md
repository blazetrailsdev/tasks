---
title: "Restore canonical children table after its suite"
status: ready
updated: 2026-07-24
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Third drift source (2 of 12 firings; postgres, sqlite). The canonical `children`
table (`packages/activerecord/src/test-helpers/test-schema.ts:1772`,
`children: { parent_id: "integer" }`) is left drifted; victims observed were
`connection-adapters/postgresql-adapter.get-client.test.ts` and
`tasks/sqlite-database-tasks.test.ts`. Culprit candidates that reshape `children`
via DDL: `persistence.test.ts`, `associations/required.test.ts`,
`adapters/postgresql/uuid.test.ts`.

## Acceptance criteria

- Identify the culprit and make it restore the canonical `children` shape after
  it runs (or use transactional fixtures / a scratch table).
- Re-measured CI shows zero repair firings for `children`.
- Rails-faithful; no test renamed; `test:compare` delta >= 0.
