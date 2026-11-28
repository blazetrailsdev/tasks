---
title: "After the npm switch: set TRAILS_ENV=production on dokku and remove the track-trails cron entry"
status: draft
updated: 2026-11-28
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 5
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#213 moved trailmap from vendored trails tarballs to `@blazetrails/*` on npm,
and switched environment selection from `NODE_ENV` to `TRAILS_ENV` (trails#10811).
Two host-side steps were left for after the merge:

- The production dokku app must have `TRAILS_ENV=production`. The image sets it
  (Dockerfile:14), but `docs/deploy.md`'s `dokku config:set` line now lists it too,
  so live config should match.
- The host crontab still runs `scripts/track-trails-cron.sh` (crontab line 15), although
  `pnpm trails:track` and the vendoring it drove are gone.

## Acceptance criteria

- `dokku config:get trailmap TRAILS_ENV` prints `production`, and `/up/ready` is green after a restart.
- The `track-trails-cron.sh` crontab entry is removed, and no script it called is left referenced.
