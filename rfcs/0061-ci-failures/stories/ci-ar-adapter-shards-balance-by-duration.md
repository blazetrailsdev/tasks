---
title: "Balance AR adapter vitest shards by measured duration"
status: draft
updated: 2026-11-10
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9955 split the AR MariaDB lane 3-way using vitest's file-count `--shard`. On its first green run the jobs took 10m46s, 7m51s and 10m43s: the fastest finished 3 min before the other two. The PostgreSQL 3-way split shows the same spread in that run (10m57s, 7m36s, 11m26s), and so does SQLite 2-way (10m08s against 12m26s). File-count sharding ignores how long each file takes, so the slowest job sets the lane's wall-clock.

## Acceptance criteria

- Balance the AR adapter shards (`ci.yml` `sqlite-tests`, `postgres-tests`, `maria-tests`) by measured file duration rather than file count. Either use a vitest custom `sequence.shard` / sequencer fed by a committed timing file, or use another mechanism that gives every test file to exactly one shard.
- Keep every file running once per lane. No gate is skipped.
- Show the before/after spread between the fastest and slowest shard from the PR's own CI run. The target is under 1 min of spread.
