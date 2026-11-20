---
title: "Balance Trailties Tests shards by file duration"
status: draft
updated: 2026-11-20
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10440 moved `trailties-tests` (`.github/workflows/ci.yml`, the
`pnpm vitest run packages/trailties packages/thor --shard=N/3` step) from 2
to 3 shards because shard 1/2 ran ~15 min (vitest 826s, 160 files) against
`timeout-minutes: 20`. On the PR's run the shards are still lopsided:
shard 1 ~13 min, shard 2 ~11 min, shard 3 ~4 min. vitest `--shard` splits
by file, not duration, so a few heavy files (server/dev-server, commands
boot tests, generator suites) pile into one shard.

## Acceptance criteria

- Identify the slowest trailties/thor test files from a CI run (per-file
  durations, e.g. a JSON reporter artifact).
- Balance the shards by duration (vitest `sequence.shard` / a custom
  sharder, or splitting the heaviest files), so no shard exceeds ~60% of
  the job timeout.
- Shard count stays at 3 or fewer unless the balance alone cannot meet the bound.
