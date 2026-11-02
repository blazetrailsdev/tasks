---
title: "Finish enabling the Solid Queue worker in production"
status: draft
updated: 2026-11-02
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Enabling the Solid Queue worker on 2026-11-02 (docs/deploy.md, "The Solid Queue worker", trailmap#110) stopped at `dokku ps:scale trailmap worker=1`: the worker crashed at boot. production_queue.sqlite3 had no tables because the release task did not run; the exception itself was not captured. Done already: queue mount, seeded stats-job.db, GH_TOKEN, STATS_SYNC_DB, STATS_SYNC_LOG. dokku records worker: 1, so the next deploy will start a worker. `web` lacks the /app/storage mount until then. GH_TOKEN currently holds the owner's personal token.

## Acceptance criteria

- `dokku ps:rebuild trailmap` (owner approval needed; restarts web) runs `db prepare`, and `.tables` lists solid*queue*\*.
- The worker stays up, web serves, and stats_sync is registered in the queue database.
- A 03:00 run writes stats-job.db and stats-sync-job.log with a `[cron-wrapper] ok` line.
- The UNTESTED note in docs/deploy.md is removed or corrected from what happened.
- GH_TOKEN is replaced with a read-only token.
