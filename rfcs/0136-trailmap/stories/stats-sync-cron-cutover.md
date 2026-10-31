---
title: "Cut the stats sync over from the crontab to StatsSyncJob"
status: draft
updated: 2026-10-31
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

After the trial, compare stats-job.db with stats.db, remove the crontab entry, and point STATS_SYNC_DB and STATS_SYNC_LOG at the real files. Confirm --refresh, --missing and --local-reviews-only have a home: the job ports only --latest.
