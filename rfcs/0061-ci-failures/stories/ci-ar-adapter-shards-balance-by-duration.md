---
title: "Balance AR adapter vitest shards by measured duration"
status: done
updated: 2026-11-18
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#10272
claim: "2026-11-17T21:06:58Z"
assignee: "ci-ar-adapter-shards-balance-by-duration"
blocked-by: null
closed-reason: null
---

## Context

trails#9955 split the AR MariaDB lane 3-way using vitest's file-count `--shard`. On its first green run the jobs took 10m46s, 7m51s and 10m43s: the fastest finished 3 min before the other two. The PostgreSQL 3-way split shows the same spread in that run (10m57s, 7m36s, 11m26s), and so does SQLite 2-way (10m08s against 12m26s). File-count sharding ignores how long each file takes, so the slowest job sets the lane's wall-clock.

## Acceptance criteria

- Balance the AR adapter shards (`ci.yml` `sqlite-tests`, `postgres-tests`, `maria-tests`) by measured file duration rather than file count. Either use a vitest custom `sequence.shard` / sequencer fed by a committed timing file, or use another mechanism that gives every test file to exactly one shard.
- Keep every file running once per lane. No gate is skipped.
- Show the before/after spread between the fastest and slowest shard from the PR's own CI run. The partition must remove the systematic imbalance. Equal predicted loads per shard and a calibrated shard-1 preload are the measure. A wall-clock spread under 1 min is not required: hosted-runner speed varies by about ±25% between jobs (trails#10272: runs 44178173797 and 44182804179, with `pnpm build` taking 51–54s against 35s on the same commit), which is ±100–200s on the ~7 min vitest step. A static partition cannot remove that. Run-time scheduling is `ci-ar-adapter-shards-dynamic-work-queue`. Amended by operator decision on 2026-11-17.
