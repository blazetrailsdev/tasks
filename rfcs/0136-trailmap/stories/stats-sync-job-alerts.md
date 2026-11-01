---
title: "StatsSyncJob failures alert like the cron wrapper did"
status: blocked
updated: 2026-11-01
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: "2026-11-01T14:56:30Z"
assignee: "attribute-rejects-a-name-that-shadows-base"
blocked-by: "No mail path in the container: msmtp is host-only and @blazetrails/actionmailer is not vendored, so EMAIL alerts need a decision (add msmtp + credentials to the image, or vendor the mailer). The watcher half is ringo's STATS_SYNC_LOG, and that log does not exist until the trial starts."
closed-reason: null
---

cron-wrapper.sh mails EMAIL through msmtp on failure; StatsSyncJob writes only the verdict line. Port the alert, and point the btwhooks stats watcher at stats-sync-job.log, before the crontab is removed.
