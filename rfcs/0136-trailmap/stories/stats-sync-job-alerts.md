---
title: "StatsSyncJob failures alert like the cron wrapper did"
status: blocked
updated: 2026-11-07
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: trailmap#127
claim: "2026-11-07T04:46:56Z"
assignee: "api-compare-gem-ports-without-api-rows"
blocked-by: "trailmap#127 merged+deployed 2026-11-07; operator step still open: btwhooks STATS_SYNC_LOG is still /home/dean/github/blazetrailsdev/stats-sync.log, not stats-sync-job.log"
closed-reason: null
---

cron-wrapper.sh mails EMAIL through msmtp on failure; StatsSyncJob writes only the verdict line. Port the alert, and point the btwhooks stats watcher at stats-sync-job.log, before the crontab is removed.
