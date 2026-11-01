---
title: "Stats sync runs as a Solid Queue recurring job"
status: done
updated: 2026-11-01
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: trailmap#103
claim: "2026-10-31T01:33:06Z"
assignee: "stats-sync-runs-as-a-solid-queue-recurring-job"
blocked-by: null
closed-reason: null
---

Move the daily trails stats sync (host crontab `0 6 * * *` running
`trails/scripts/sync-stats/cron-wrapper.sh` → `pnpm stats:sync --latest`) into a
Solid Queue recurring job in trailmap.

Decided by the owner (2026-10-29):

- A dokku `worker:` process runs the Solid Queue supervisor (`bin/jobs`).
- A `queue` database in the Rails 8 shape (`storage/production_queue.sqlite3`,
  `db/queue_schema.ts`), loaded by the release task.
- `StatsSyncJob` (app/jobs) ports sync.ts's `--latest` path in-process. It
  still calls the `gh` CLI (installed in the image, `GH_TOKEN`), but never
  `pnpm` or sync.ts.
- During the trial the job writes its OWN database (`STATS_SYNC_DB`, e.g.
  `stats-job.db`), never the cron's `stats.db`, and its own log in the
  `[cron-wrapper]` verdict shape. The cron stays until the owner says otherwise.
- The schedule is `config/recurring.yml` at 06:00 America/Detroit;
  `limitsConcurrency` keeps two runs from overlapping.
- The Rails twin of the queue is a separate story.

## Acceptance

- `bin/jobs` boots the supervisor in production and the scheduler enqueues
  `StatsSyncJob` on schedule.
- The job fills `STATS_SYNC_DB` with the same tables and rows `--latest` writes,
  retries rate-limit and transient gh failures with `retryOn`, flags a gap wider
  than 26h, and writes an `ok` / `failed at stage …` verdict line per run.
- docs/deploy.md has the storage mount, `GH_TOKEN`, `STATS_SYNC_DB` and
  `ps:scale worker=1` steps.
