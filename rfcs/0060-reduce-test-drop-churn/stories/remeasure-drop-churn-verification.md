---
title: "Re-run DDL_PROFILE and verify DROP-churn reduction vs #4499 baseline"
status: draft
updated: 2026-07-03
rfc: "0060-reduce-test-drop-churn"
cluster: null
deps:
  [
    "truncate-based-global-reset",
    "remove-redundant-dropexisting-shields",
    "audit-afterall-dropalltables-callers",
    "gate-repairworkerschema-drops-behind-drift",
    "pg-scope-referential-integrity-to-loaded-tables",
  ]
deps-rfc: []
est-loc: 100
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Verification story for the RFC. PR #4499 established the baseline by turning on
the dormant `DDL_PROFILE=1` profiler (`test-helpers/ddl-profile.ts` +
`scripts/ddl-profile-aggregate.mjs`) across the sqlite / postgres / maria AR CI
lanes and uploading per-lane aggregate artifacts. This story re-runs that
identical protocol on the post-reduction tree and records the deltas as the
RFC's acceptance gate, then updates the analysis doc.

Baseline (PR #4499): DROP_TABLE ops sqlite 90,094 / PG 96,799 / MariaDB 95,190;
DROP ~95% of schema-DDL ms; PG REFERENTIAL_INTEGRITY 273,656 ms (69% of PG DDL).

## Acceptance criteria

- Re-run the PR #4499 `DDL_PROFILE=1` wiring (same one-off measurement branch
  approach) after the reduction stories land; capture per-lane aggregate
  artifacts.
- Confirm the RFC targets: DROP_TABLE ops ≥ 90% down on each adapter; schema-DDL
  ms ≥ 85% down; PG REFERENTIAL_INTEGRITY ms ≥ 60% down. Record the actual
  numbers in a results table.
- Update
  `docs/infrastructure/ar-test-reset-raw-sql-burndown-churn-payoff-verification.md`
  with the new numbers (docs-only, exempt from the AR docs freeze).
- If any target is missed, file the residual DROP source as a new story under
  this RFC rather than widening this one.
