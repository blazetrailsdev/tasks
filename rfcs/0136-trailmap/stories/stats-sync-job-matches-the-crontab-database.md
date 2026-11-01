---
title: "Compare the job's stats database with the crontab's before cutover"
status: draft
updated: 2026-11-01
rfc: "0136-trailmap"
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

A local syncLatest on a stamped copy of stats.db worked on 2026-11-01. Still unproved: row-by-row match against the crontab's run, bin/jobs with the seeded file, gh and writes in the container, the 03:00 trigger, limitsConcurrency in a live process, and the gh pr list failure seen in one overlapping E2E run, never explained. Do this during the trial, before stats-sync-cron-cutover.
