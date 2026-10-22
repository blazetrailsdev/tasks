---
title: "Drop the tasks-only dokku mount now that the parent directory is mounted"
status: claimed
updated: 2026-10-22
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: "2026-10-22T18:56:33Z"
assignee: "bump-the-ringo-pin-to-carry-the-write-path-and-smoke-cards"
blocked-by: null
closed-reason: null
---

## Context

trailmap#71 applied `dokku storage:mount trailmap /home/dean/github/blazetrailsdev:/home/dean/github/blazetrailsdev`
so `STATS_DB` can reach `stats.db` and its WAL sidecars. The older mount
`/home/dean/github/blazetrailsdev/tasks:/home/dean/github/blazetrailsdev/tasks`
is now nested inside it and redundant. docs/deploy.md ("The stats database")
says so, and leaves removing it to a separate change.

## Acceptance criteria

- [ ] `dokku storage:unmount` removes the tasks-only mount; `dokku storage:list trailmap` shows only the parent directory
- [ ] docs/deploy.md's tasks.db section names the parent mount and drops the "redundant, left in place" note
- [ ] after a restart, `scripts/smoke-prod.sh` tiers 0–2 pass
