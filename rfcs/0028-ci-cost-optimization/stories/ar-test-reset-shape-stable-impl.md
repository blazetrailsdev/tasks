---
title: "Implement shape-stable reset to cut DROP TABLE churn (dominant path)"
status: draft
updated: 2026-06-22
rfc: "0028-ci-cost-optimization"
cluster: null
deps: ["ar-test-reset-drop-table-churn"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Implementation follow-on to the spike `ar-test-reset-drop-table-churn`, which
measures and chooses the reset strategy for AR test teardown. Background: the
DDL-timing audit (PR #3904) found **DROP TABLE dominates AR CI DDL cost** —
PostgreSQL 86,810 drops/run (98.8s, 63% of DDL ms), MariaDB 85,781 (62.3s, 87%)
— from per-file teardown mass-dropping the canonical table set. RFC 0008's
clonable schema template already cut CREATE TABLE; the residual is teardown.

Drop paths live in `packages/activerecord/src/test-helpers/`: `drop-all-tables.ts`
(`dropAllTables`), `define-schema.ts` (`defineSchema(..., {dropExisting:true})`),
`schema-repair.ts` (`repairWorkerSchema`).

**Do not start before the spike closes** (`deps: ar-test-reset-drop-table-churn`)
— the spike picks TRUNCATE-only vs clone-per-file and the measured per-path
breakdown that scopes this work. If the spike's breakdown shows the drops split
across multiple paths, this story implements only the single dominant path; the
spike registers the remaining paths as their own stories (keep each PR under the
500 LOC ceiling — do NOT fan out PRs yourself).

## Acceptance criteria

- Implement the spike-chosen reset on the dominant drop path: a shape-stable
  reset (TRUNCATE-only when the table shape matches the canonical schema; DROP
  only on detected drift) OR clone-a-fresh-DB-per-file — whichever the spike
  selected. Keep the defensive full-canonical DROP only where shape actually drifts.
- No fidelity regression: canonical schema/fixtures unchanged; no new shared-DB
  flakes across sqlite/pg/mysql (re-run the touched files, watch the documented
  shared-table flake set).
- Re-measure with the DDL_PROFILE instrumentation: DROP count and AR job
  wall-clock drop materially vs the pre-change baseline; record the delta in the PR.
- PR under the 500 LOC ceiling; remaining drop-paths (if any) registered as
  separate stories, not fanned-out PRs.
