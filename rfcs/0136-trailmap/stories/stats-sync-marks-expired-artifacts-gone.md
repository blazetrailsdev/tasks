---
title: "Stats sync marks expired job-log artifacts gone instead of retrying them every run"
status: ready
updated: 2026-11-16
rfc: "0136-trailmap"
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

Each StatsSyncJob run (now hourly, since trailmap#144) retries about 20 job-log artifact downloads that fail with "no valid artifacts found", because GitHub has already expired the artifact. `lib/stats-sync/sync.ts` writes each failed `gh` call to STATS_SYNC_LOG (:65-78). The `expired_job_log` model (`app/models/stats-sync/expired-job-log.ts`) and `sync_log.missing_artifact` (db/stats-sync-migrate/20261105000001) already exist.

## Acceptance criteria

- On "no valid artifacts found", record the artifact as gone, so later runs skip it and don't call GitHub again.
- Add a test: a second sync makes no gh call for an artifact already recorded as gone.
