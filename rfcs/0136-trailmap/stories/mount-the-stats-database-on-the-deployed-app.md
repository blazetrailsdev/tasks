---
title: "Mount the stats database and set STATS_DB on the deployed app, and document it"
status: done
updated: 2026-10-20
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trailmap#71
claim: "2026-10-20T14:01:25Z"
assignee: "bump-the-ringo-pin-to-carry-the-write-path-and-smoke-cards"
blocked-by: null
closed-reason: null
---

Follow-up to trailmap#53.

`/graphs/parity` reads the trails stats database through `STATS_DB`
(config/database.ts `statsDatabaseConfig`). An unset `STATS_DB` is deliberately
not a boot failure, so the deployed app comes up green and the page says the
source is missing. Nothing in docs/deploy.md, README.md or the dokku setup
mentions `STATS_DB`, so the deployed page has no data.

## Do

- Mount the host's `stats.db` (the one the nightly stats-sync cron fills) into
  the dokku app. Mount the DIRECTORY, writable: a read-only connection to a WAL
  database still creates `-shm` (see the note in config/database.ts).
- `dokku config:set trailmap STATS_DB=<mounted path>`.
- Document both in docs/deploy.md beside the tasks.db mount, and add `STATS_DB`
  to README's database table as the third connection.

## Acceptance

- [ ] deployed `/graphs/parity` draws a chart
- [ ] docs/deploy.md and README name `STATS_DB` and the mount
- [ ] a write through the deployed connection is still refused (`readonly: true`)
