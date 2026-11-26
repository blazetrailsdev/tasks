---
title: "AR PostgreSQL non-isolated cases step runs 126-309s and one shard exceeded baseline"
status: draft
updated: 2026-11-26
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10765 added a non-isolated Active Record cases step
(`scripts/ci/ar-non-isolated-cases.sh`, called from the SQLite, PostgreSQL and
MariaDB lanes in `.github/workflows/ci.yml`). Job wall time, PR runs against
four `main` baseline runs:

| Lane       | Baseline | With the step    | Cases step |
| ---------- | -------- | ---------------- | ---------- |
| SQLite     | 545–739s | 304–498s         | 41–84s     |
| MariaDB    | 583–914s | 421 / 427 / 563s | —          |
| PostgreSQL | 593–714s | 518 / 532 / 736s | 126–309s   |

PostgreSQL gains least, and in one run shard 2 took 736s, above the baseline
range, with the cases step alone at 309s. The cause was not investigated.
Candidates, none verified: the shard's file set re-running many files isolated
(each re-run boots the schema again); `resetTestTables` in
`packages/activerecord/test/support/test-setup-dy.ts` costing far more per file
on PostgreSQL than on SQLite; advisory-slot acquisition in
`test/support/test-setup-worker-db.ts`; or `VITEST_SHARD_DURATIONS` balancing
the cases step with durations recorded for isolated runs.

## Acceptance criteria

- The PostgreSQL cases step is timed per phase over several `main` runs
  (non-isolated pass, number of files re-run, re-run wall time) from the job
  logs, per shard.
- The dominant cost is named with a measurement, and fixed if it is in the
  harness (per-file reset cost, shard balance), or filed against the leaking
  files if it is the re-run.
- PostgreSQL shard wall time is below the pre-trails#10765 baseline on every
  shard, or the story records why it cannot be.
