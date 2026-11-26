---
title: "Schedule AR adapter shard files from a shared run-time work queue"
status: ready
updated: 2026-11-26
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10272 balances the AR adapter `--shard` legs with a committed per-file timing table (`scripts/ci/duration-sequencer.ts`, `scripts/ci/ar-shard-durations.json`). Two CI samples still had 2–4 min of spread between the fastest and slowest shard (runs 44178173797 and 44182804179). The cause is hosted-runner speed, which varies by about ±25% between jobs: `pnpm build` took 51–54s against 35s on the same commit. Which shard is slow changes from run to run, so no fixed partition can correct for it.

## Acceptance criteria

- Shards pull test files at run time from a work queue all the lane's jobs share, instead of each taking a fixed partition. The queue could be an Actions cache or artifact, or a service. Each file still runs exactly once per lane.
- No new third-party runtime dependency.
- Show the fastest-to-slowest shard spread across at least two CI runs. The target is under 1 min.
