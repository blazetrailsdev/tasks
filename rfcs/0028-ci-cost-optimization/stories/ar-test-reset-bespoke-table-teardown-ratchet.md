---
title: "Tighten require-table-teardown ratchet to curb leaked bespoke tables (Path D)"
status: ready
updated: 2026-06-23
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

From the `ar-test-reset-drop-table-churn` spike (PR #3953, audit at
`docs/infrastructure/ar-test-reset-drop-table-churn-audit.md`, Path D).

The audit's ~2,600 _distinct_ dropped-table figure is driven by leaked bespoke
tables (created via raw `createTable` and never torn down) that accumulate on
the shared per-worker DB and get re-dropped by every `dropAllTables` fan-out
(`drop-all-tables.ts`). `schema-repair.ts` deliberately leaves these alone
(header note: dropping unknown tables risks clobbering a file's legit scratch
table), so the lever is preventing accumulation, not blanket-dropping.

## Acceptance criteria

- Extend the `require-table-teardown` ESLint ratchet so newly-leaked bespoke
  tables are flagged, driving down the distinct-table count Path D fans out over.
- Burn down (or grandfather + track) existing offenders.
- Off the hot path; schedule after `ar-test-reset-shape-stable-impl` and
  `ar-test-reset-signature-cache-no-blanket-clear`.
- Files: the `require-table-teardown` rule + its grandfathered exclude list.
