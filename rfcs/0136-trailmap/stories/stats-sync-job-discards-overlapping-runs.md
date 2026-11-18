---
title: "StatsSyncJob discards an overlapping hourly run"
status: claimed
updated: 2026-11-18
rfc: "0136-trailmap"
cluster: null
packages: []
deps:
  - solid-queue-limits-concurrency-on-conflict-discard
deps-rfc: []
est-loc: 20
priority: 7
pr: null
claim: "2026-11-18T22:21:35Z"
assignee: "view-tests-build-views-in-a-fresh-worktree"
blocked-by: null
closed-reason: null
---

## Context

trailmap `app/jobs/stats-sync-job.ts` limits concurrency with `limitsConcurrency({ key: "stats_sync", duration: Duration.hours(2) })` and has to block overlapping hourly runs, because solid_queue v1.1.3 has no `on_conflict`. Depends on the trails story `solid-queue-limits-concurrency-on-conflict-discard`.

## Acceptance criteria

- Pass `onConflict: "discard"` to StatsSyncJob's `limitsConcurrency`, so an hourly run that overlaps a running one is dropped instead of queued.
- Add a test in `test/jobs/stats-sync-job.test.ts`.
