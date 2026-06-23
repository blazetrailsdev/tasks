---
title: "Spike: locate the dominant DROP TABLE source in AR test teardown (86k/run)"
status: ready
updated: 2026-06-22
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

DDL-timing audit (PR #3904, audit `ddl-timing-profile`) profiled the full AR
suite on CI. **DROP TABLE is the dominant DDL cost**: PostgreSQL issues
**86,810 DROP TABLE / run (98.8s, 63% of DDL ms)** and MariaDB **85,781
(62.3s, 87%)**, against only ~7,400 CREATE TABLE each (~11.7:1 drop:create).
~2,600 distinct tables are each dropped ~33× (hot tables: posts, books, tasks,
ar_internal_metadata, encrypted_books — 300–500 drops each).

RFC 0008 (clonable schema template) is closed/done for sqlite+PG+MariaDB and
already cut CREATE TABLE to ~7.4k (the template absorbs creation). The residual,
now-dominant cost is the **per-file teardown/reset that mass-drops the canonical
table set**, file after file — unaddressed by template-clone.

Drop paths to investigate (all in `packages/activerecord/src/test-helpers/`):
`drop-all-tables.ts` (`dropAllTables`), `define-schema.ts`
(`defineSchema(..., {dropExisting:true})`), and `schema-repair.ts` /
`repairWorkerSchema`. AR adapter jobs are ~50% of CI minutes (RFC 0028) and
vitest step wall-clock is PG 581s / Maria 496s, so cutting DROP churn directly
cuts the merge bar.

## Acceptance criteria

- Reuse the DDL_PROFILE instrumentation from PR #3904 to produce a **measured
  per-path breakdown** of the 86k drops: how many originate from per-file
  `defineSchema(..., {dropExisting:true})`, `afterAll(dropAllTables)`, and
  `repairWorkerSchema` respectively.
- Recommend ONE reset strategy with rationale: shape-stable TRUNCATE-only (DROP
  only on detected shape drift) **vs** clone-a-fresh-DB-per-file. Note the
  flake/fidelity risk of each and which test-helpers files each touches.
- Output: an `audit-report` (no production code change) decomposing the
  implementation into appropriately-sized follow-on stories. The implementation
  story `ar-test-reset-shape-stable-impl` is the first of these and depends on
  this spike.
- Done-when-closed (spike): the PR may be closed-unmerged once the report lands.
