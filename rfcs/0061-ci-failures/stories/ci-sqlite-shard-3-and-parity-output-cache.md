---
title: "ci-sqlite-shard-3-and-parity-output-cache"
status: draft
updated: 2026-11-10
rfc: "0061-ci-failures"
cluster: null
packages: []
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

Measured on 50 completed ci.yml runs (2026-11-09 13:27Z to 2026-11-10 14:54Z; 300 runs in the window, 200 of them cancelled as superseded):

- Run wall-clock median 19.3 min (p90 27.2). Runner-minutes per completed run: median 126.
- Queue time is not the bottleneck: the first job starts 0.3 min after the run is created (median), and per-job start lag is 2.3 min median (p90 9.3).
- Critical path: Trailties Tests 15.4 min, then MariaDB 13.8. trails#9954 shards Trailties and trails#9955 shards MariaDB. After both, the critical path is **AR SQLite (1)/(2) at 10.5 / 11.0 min** (max 14.8), then PostgreSQL at about 10.6.
- Rails API/Test Comparison (4.7 min) and Repo Checks (4.6 min) run on every one of the 50 runs.
- Two runs in three are cancelled. `concurrency` (`ci.yml:45-47`) already cancels in-progress PR runs, so the waste is runner time spent on superseded pushes before the cancel lands.

## Acceptance criteria

- Shard the SQLite lane 3-way on hosted runners (`sqlite_shards` in the `changes` job's `self_hosted` step, `ci.yml:~371`), keeping the shard-1-only steps, so its wall drops to about 7.5 min. Measure the before/after from the PR's own run.
- Measure whether parity:api / parity:test outputs can be cached across runs keyed on the source hash without weakening the gate. Ship the cache if it is safe, or record the measurement here if it is not.
- Record the post-#9954/#9955 run wall-clock median over 50 runs in this story's closing PR.
