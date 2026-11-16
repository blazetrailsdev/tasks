---
title: "Bump solid_queue and port limits_concurrency on_conflict: :discard"
status: ready
updated: 2026-11-16
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#144 wanted `limits_concurrency ... on_conflict: :discard` for the hourly StatsSyncJob, so that an overlapping run is dropped instead of queued. The trails port (`packages/solid-queue/src/active-job/concurrency-controls.ts`, `ClassMethods.limitsConcurrency({ key, to, group, duration })`) mirrors vendored solid_queue v1.1.3 (`vendor/solid_queue/v1.1.3/lib/active_job/concurrency_controls.rb`), which has no `on_conflict`. Upstream added `on_conflict: :block | :discard` in solid_queue 1.2. Because of that, trailmap's `app/jobs/stats-sync-job.ts` uses a 2h blocking lock.

## Acceptance criteria

- Bump the vendored solid_queue to a release with `on_conflict` (vendor/README.md § "Upgrading a source").
- Port `on_conflict` in `limitsConcurrency` and the discard arm in the job's enqueue path (`ReadyExecution`/`BlockedExecution` dispatch), with the upstream tests.
