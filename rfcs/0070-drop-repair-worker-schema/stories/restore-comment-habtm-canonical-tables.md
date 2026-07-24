---
title: "Restore canonical lessons_students/students/posts/topics after their suite"
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

1 of 12 firings (mysql). Canonical `lessons_students`, `students`, `posts`,
`topics` (`packages/activerecord/src/test-helpers/test-schema.ts:897` etc.)
drifted together; victim was `comment.test.ts`. Culprit is a HABTM/students
suite that reshapes these canonical tables without restoring; confirm by
grepping DDL/`defineSchema` on `lessons_students`/`students`.

## Acceptance criteria

- Identify the culprit and make it restore the canonical shape of all four
  tables after it runs (or use transactional fixtures / scratch tables).
- Re-measured CI shows zero repair firings for this table set.
- Rails-faithful; no test renamed; `test:compare` delta >= 0.
