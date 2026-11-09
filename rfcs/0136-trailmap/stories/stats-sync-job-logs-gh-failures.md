---
title: "StatsSyncJob: log gh failures so the overlapping-run gh pr list failure is diagnosable"
status: done
updated: 2026-11-09
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trailmap#135
claim: "2026-11-09T20:55:16Z"
assignee: "e2e-cover-the-pane-message-box"
blocked-by: null
closed-reason: null
---

## Context

stats-sync-job-matches-the-crontab-database (trailmap#133) proved the job
against the crontab, row by row (docs/deploy.md, "Compare before cutover"),
but one item stayed unexplained: a `gh pr list` failure seen once, during an
E2E run that overlapped a sync. Six consecutive 03:00 runs (queue jobs 1-6)
did not reproduce it, and the worker's logs from before the 2026-11-08 15:51
restart are gone, so the original error text is lost.

## Acceptance criteria

- `StatsSyncJob` logs `gh`'s exit status and stderr when a `gh` call fails, to
  the job's log that btwhooks' watcher reads.
- Either an overlapping run (two syncs or a sync plus E2E) is reproduced and
  the cause fixed, or the logging lands before stats-sync-cron-cutover so the
  next occurrence is diagnosable.
