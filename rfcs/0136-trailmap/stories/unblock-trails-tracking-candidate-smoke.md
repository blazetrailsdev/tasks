---
title: "Trails tracking fails at candidate-smoke; the pin is 2,120 commits behind"
status: in-progress
updated: 2026-10-30
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: tasks#303
claim: "2026-10-30T09:56:35Z"
assignee: "split-the-render-pages-the-rails-way-story"
blocked-by: null
closed-reason: null
---

## Context

`TRAILS_TRACK_DRY_RUN=1 scripts/track-trails.sh` (tasks repo) fails at stage `candidate-smoke` against trails e368e438c on 2026-10-22 (log `~/.cache/trails-tracker/track-20261022T201631Z.log`), as it did on 2026-09-09. The pin (`6bf0fbde`) is 2,120 commits behind, and `pnpm trails:status` exits non-zero. schedule-continuous-trails-tracking cannot sensibly install its hourly cron (tasks#290 carries the wrapper) while every run would fail.

## Acceptance criteria

- The candidate-smoke failure is diagnosed from the log: a trails defect gets a trails story, a tasks-side incompatibility is fixed in tasks.
- A dry run passes against current trails main.
- The first real bump is reviewed by a person (it is ~2,000 commits), and only then is the cron installed.
