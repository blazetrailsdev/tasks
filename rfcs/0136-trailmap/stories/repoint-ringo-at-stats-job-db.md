---
title: "Repoint ringo's statsDBPath at stats-job.db before stats.db is retired"
status: in-progress
updated: 2026-11-07
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trailmap#126
claim: "2026-11-07T01:47:08Z"
assignee: "deviations-mark-null-matched-renders-null"
blocked-by: null
closed-reason: null
---

## Context

trailmap#124 moved trailmap's `STATS_DB` to `stats-job.db`, which StatsSyncJob
fills. Ringo still reads the crontab's `stats.db` through `statsDBPath()` in
`webhook/parity.go`, which defaults to `$HOME/github/blazetrailsdev/stats.db` and
reads a `STATS_DB` override. It uses that file for its report cards and parity
pages. `stats-sync-cron-cutover` removes the crontab. Once that happens,
`stats.db` stops updating and ringo's pages go stale without failing.

## Acceptance criteria

- Ringo's environment sets `STATS_DB` to `stats-job.db`, and its stats pages
  render from it.
- `stats-sync-cron-cutover` lists this story in `deps`, so the crontab is not
  removed first.
- docs/deploy.md's "do not delete `stats.db`" note says when deleting it becomes
  safe.
