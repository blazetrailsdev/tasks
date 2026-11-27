---
title: "Return trailmap's worker to Solid Queue fork mode once trails#10600 is vendored"
status: ready
updated: 2026-11-27
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

On 2026-11-22 trailmap's worker was set to `SOLID_QUEUE_SUPERVISOR_MODE=async`
(`dokku config:set trailmap`) because the vendored trails pin from trailmap#191
(e3b832caf9) ran Solid Queue in fork mode, and a forked scheduler dropped its
recurring tasks: `solid_queue_recurring_tasks` stayed empty and `StatsSyncJob`
(`config/recurring.yml`) stopped running after 07:17 UTC. trails#10600 fixed
the fork path (`packages/solid-queue/lib/processes/fork-entry.ts` rebuilds each
`RecurringTask` before constructing the scheduler).

Fork mode is Solid Queue's default
(`vendor/solid_queue/v1.7.2/lib/solid_queue/configuration.rb`,
`mode: ENV["SOLID_QUEUE_SUPERVISOR_MODE"] || :fork`), so the override is a
deployment-only deviation from the default.

## Acceptance criteria

- trailmap's vendored trails is bumped past trails#10600 (its own PR).
- `dokku config:unset trailmap SOLID_QUEUE_SUPERVISOR_MODE`, then the worker
  logs `Started Supervisor(fork)` and `solid_queue_recurring_tasks` holds
  `stats_sync`.
- The next `:17` run of `StatsSyncJob` appears in `solid_queue_jobs` and the
  stats sync log.
