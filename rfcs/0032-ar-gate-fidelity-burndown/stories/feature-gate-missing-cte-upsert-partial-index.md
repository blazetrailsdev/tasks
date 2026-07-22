---
title: "feature-gate-missing-cte-upsert-partial-index"
status: ready
updated: 2026-07-22
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`test:compare --gates` (2026-07-22) — 6 missing-/wrong-gate rows where Rails
gates on a supports\_\* feature and trails is unconditional or adapter-gated:

- relation/merging.test.ts:499, :509, :524 — the three CTE merging tests;
  rails `features=[common_table_expressions]`, ts unconditional. Gate
  `itIfSupports("common_table_expressions")`.
- query-cache.test.ts:957 "insert all" — rails
  `features=[insert_on_duplicate_skip]` (body-skip); :983 "upsert all" — rails
  `features=[insert_on_duplicate_update]`; ts unconditional.
- validations/uniqueness-validation.test.ts:839 "partial index" — rails
  `features=[partial_index]` (body-skip); ts `skipIf(mysql)` adapter gate.

Check `test-helpers/supports.ts` has each feature key with Rails-faithful
adapter coverage; add any missing key mirroring Rails supports\_\* methods.

## Acceptance criteria

- [ ] All 6 tests feature-gated so `adapterFeatureKey(ts)` equals railsGate;
      `test:compare --gates` shows no mismatch for them.
- [ ] Test names/bodies unchanged apart from gating.
