---
title: "Restore canonical fk_test tables after adapter.test.ts"
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

1 of 12 firings (sqlite). Canonical `fk_test_has_pk` / `fk_test_has_fk`
(`packages/activerecord/src/test-helpers/test-schema.ts:1658`) drifted; victim
was `associations/has-one-associations.test.ts`. Culprit: `adapter.test.ts`
`defineSchema`s the FK-test tables (also reproduced locally via
`insert-all.test.ts`) and does not restore the canonical shape.

## Acceptance criteria

- Culprit restores canonical `fk_test_has_pk`/`fk_test_has_fk` shape after it
  runs (or uses transactional fixtures / scratch tables). Aligns with RFC 0059
  (drop `defineSchema`).
- Re-measured CI shows zero repair firings for these tables.
- Rails-faithful; no test renamed; `test:compare` delta >= 0.
