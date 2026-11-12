---
title: "solid-queue-quit-supervisee-exits-like-exit-bang"
status: draft
updated: 2026-11-12
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# A QUIT supervisee stops claiming work and reaps with exit status 1

## Context

Ruby's supervised process answers `QUIT` with `exit!`
(`vendor/solid_queue/v1.1.3/lib/solid_queue/processes/supervised.rb:35-36`),
so it stops at once and the supervisor reaps it with exit status 1, and
`Supervisor#reap_terminated_forks` (`supervisor.rb`) then fails its claimed jobs
through `handle_claimed_jobs_by`.

In trails the supervisee is a thread. `Signals#signalProcess`'s QUIT arm
(`packages/solid-queue/lib/supervisor/signals.ts`) calls `_thread.kill()`, which
marks the thread dead but cannot stop its async body
(`packages/ruby-compat/lib/thread.ts`, `Thread#exit`). As a result:

- the killed worker's poll loop keeps running and claims jobs that the
  supervisor's deregistration released, so a job starts twice;
- `Supervisor#waitpid2` (`packages/solid-queue/lib/supervisor.ts`) reports
  `exitstatus: 0` for a supervisee that had already been stopped by TERM, so
  `reapTerminatedForks` skips `handleClaimedJobsBy` and the claimed execution
  survives.

Two `processes_lifecycle` tests are parked on this
(`packages/solid-queue/test/integration/processes-lifecycle.test.ts`):
"quit supervisor while there are jobs in-flight" and
"term supervisor exceeding timeout while there are jobs in-flight"
(`vendor/solid_queue/v1.1.3/test/integration/processes_lifecycle_test.rb:64-85,121-148`).

## Acceptance criteria

- A QUIT supervisee stops polling and claiming once its thread is killed.
- `waitpid2` reports a QUIT supervisee as `exit!`'s status 1, so its claimed jobs are failed.
- Both tests are un-skipped and pass on all three adapters.
