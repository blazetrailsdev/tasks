---
title: "StatsSyncJob: run deadline under the lock, and STATS_SYNC_LOG rotation"
status: ready
updated: 2026-11-16
rfc: "0136-trailmap"
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

After trailmap#144, StatsSyncJob runs hourly with a 2h `limitsConcurrency` lock (`app/jobs/stats-sync-job.ts`). A run that hangs longer than 2h loses its lock while it is still running, and the next run can race it. Separately, nothing rotates STATS_SYNC_LOG (docs/deploy.md:637), which grows by about 24 runs a day. `readLogTail` already keeps reads bounded, so the size problem is disk space.

## Acceptance criteria

- Give `syncLatest` a wall-clock deadline below the lock duration, and treat hitting it as a failed run with its own verdict line.
- Rotate STATS_SYNC_LOG, or trim it to the last N days, while keeping the `=== ts ===` / `[cron-wrapper]` lines that btwhooks' stats watcher reads.
