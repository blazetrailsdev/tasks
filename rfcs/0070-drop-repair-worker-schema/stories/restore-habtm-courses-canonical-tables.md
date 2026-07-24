---
title: "Restore canonical courses/colleges/professors HABTM tables after their suite"
status: draft
updated: 2026-07-24
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Second drift source (2 of 12 firings; sqlite). The canonical HABTM many-to-many
tables `courses`, `colleges`, `professors`, `courses_professors`
(`packages/activerecord/src/test-helpers/test-schema.ts:1719-1723`) are left
drifted for siblings; victims observed were `deprecator.test.ts` and
`database-selector.test.ts` (neither touches these tables — pure victims). The
culprit is a HABTM/multi-db suite that drops or reshapes them without restoring;
candidates to confirm: `associations/has-and-belongs-to-many-associations.test.ts`,
`multiple-db.test.ts`, `base-prevent-writes.test.ts`.

## Acceptance criteria

- Identify the culprit suite (grep DDL/`defineSchema` on `colleges`/`professors`)
  and make it restore the canonical shape of all four tables after it runs (or
  use transactional fixtures / scratch tables).
- Re-measured CI shows zero repair firings for this table set.
- Rails-faithful teardown; no test renamed; `test:compare` delta >= 0.
