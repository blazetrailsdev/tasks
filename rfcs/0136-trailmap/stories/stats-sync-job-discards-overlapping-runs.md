---
title: "StatsSyncJob discards an overlapping hourly run"
status: blocked
updated: 2026-11-16
rfc: "0136-trailmap"
cluster: null
packages: []
deps:
  - solid-queue-limits-concurrency-on-conflict-discard
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: "2026-11-16T22:21:26Z"
assignee: "command-palette-footer-hints-follow-the-mode"
blocked-by: "onConflict landed in trails#10198 but vendor pin a7270c9 predates it; needs a separate re-vendor PR"
closed-reason: null
---

## Context

trailmap `app/jobs/stats-sync-job.ts` limits concurrency with `limitsConcurrency({ key: "stats_sync", duration: Duration.hours(2) })` and has to block overlapping hourly runs, because solid_queue v1.1.3 has no `on_conflict`. Depends on the trails story `solid-queue-limits-concurrency-on-conflict-discard`.

## Acceptance criteria

- Pass `onConflict: "discard"` to StatsSyncJob's `limitsConcurrency`, so an hourly run that overlaps a running one is dropped instead of queued.
- Add a test in `test/jobs/stats-sync-job.test.ts`.
