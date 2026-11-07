---
title: "Cut the stats sync over from the crontab to StatsSyncJob"
status: blocked
updated: 2026-11-07
rfc: "0136-trailmap"
cluster: null
packages: []
deps:
  - repoint-ringo-at-stats-job-db
  - stats-sync-job-matches-the-crontab-database
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: "2026-11-01T14:56:30Z"
assignee: "attribute-rejects-a-name-that-shadows-base"
blocked-by: "Waits on the trial comparison (stats-sync-job-matches-the-crontab-database, now ready: worker=1 and stats-job.db syncing nightly). --refresh, --missing and --local-reviews-only still have no home"
closed-reason: null
---

After the trial, compare stats-job.db with stats.db, remove the crontab entry, and point STATS_SYNC_DB and STATS_SYNC_LOG at the real files. Confirm --refresh, --missing and --local-reviews-only have a home: the job ports only --latest.
