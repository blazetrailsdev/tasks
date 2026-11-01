---
title: "track-trails: candidate smoke fails in PostgreSQLDatabaseTasks.create at trails 6b815eb19"
status: ready
updated: 2026-11-01
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A `TRAILS_TRACK_DRY_RUN=1` run of `scripts/track-trails.sh` (branch copy, before trailmap#104 merged) vendored trails `6b815eb19`, then `scripts/smoke-boot.sh` failed with `TypeError: no implicit conversion of nil into String` in `PostgreSQLDatabaseTasks.create`. Log on the box: `~/.cache/trailmap-trails-tracker/track-20261031T174036Z.log`, line 124. The cause was not found: it may be a variable missing from that shell, or a regression in the bump from `47d395e36d`.

## Acceptance criteria

- The cause is identified. A framework defect is fixed in trails with a test there; a missing variable is required by name in `smoke-boot.sh` or `track-trails.sh`.
- `TRAILS_TRACK_DRY_RUN=1 pnpm trails:track` reaches "candidate passed".
